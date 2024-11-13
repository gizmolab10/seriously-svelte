import { s_db_type, s_hierarchy, s_edit_state, s_db_loadTime } from '../state/Svelte_Stores';
import { IDPersistent, persistLocal, Startup_State } from '../common/Global_Imports';
import { s_startup_state, s_showing_tools_ancestry } from '../state/Svelte_Stores';
import { g, k, get, debug, signals, Hierarchy } from '../common/Global_Imports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { DBType } from './DBInterface';
import { dbLocal } from './DBLocal';

// each db has its own hierarchy
// when switching to another db
// s_hierarchy is set to its hierarchy

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const type = queryStrings.get('db');
		if (!!type) {
			this.db_set_accordingToType(type);
			s_db_type.set(type);
		}
		this.db.queryStrings_apply();
	}

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_db_type.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db.dbType != type))) {
				done = true;
				setTimeout(() => {
					(async () => {
						await this.hierarchy_fetch_andBuild_forDBType(type);
					})();
				}, 10);
			}
		});
	}

	db_set_accordingToType(type: string) { this.db = this.db_forType(type); }
	restore_db() { s_db_type.set(persistLocal.read_key(IDPersistent.db) ?? 'firebase'); }
	db_change_toNext(forward: boolean) { this.db_change_toType(this.db_next_get(forward)); }

	get startupExplanation(): string {
		const type = this.db.dbType;
		let from = k.empty;
		switch (type) {
			case DBType.firebase: from = `, from ${this.db.baseID}`; break;
			case DBType.local:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

	async hierarchy_fetch_andBuild_forDBType(type: string) {
		persistLocal.write_key(IDPersistent.db, type);
		this.db_set_accordingToType(type);
		this.queryStrings_apply();
		if (this.db.hasData) {
			s_hierarchy.set(this.db.hierarchy);
		} else {
			this.hierarchy_fetch_andBuild();
		}
		setTimeout(() => {
			this.conclude_fetch();
			signals.signal_rebuildGraph_fromFocus();
		}, 1);
	}

	async hierarchy_fetch_andBuild() {
		const startTime = new Date().getTime();
		s_db_loadTime.set(null);
		const h = this.db.hierarchy = new Hierarchy(this.db);
		s_hierarchy.set(h);
		if (this.db.isRemote) {
			s_startup_state.set(Startup_State.fetch);
		}
		await this.db.fetch_all();
		await h.add_missing_removeNulls(this.db.baseID);
		h.rootAncestry_setup();
		h.ancestries_rebuildAll();
		if (this.db.isRemote) {
			this.set_loadTime(startTime);
		}
	}

	conclude_fetch() {
		s_edit_state.set(null);
		s_startup_state.set(Startup_State.ready);
		s_showing_tools_ancestry.set(null);
		persistLocal.restore_grabbed_andExpanded(true);
		// persistLocal.restore_page_states();
		persistLocal.restore_focus();
		this.db.setHasData(true);
		get(s_hierarchy).conclude_fetch();
	}

	set_loadTime(startTime: number) {
		const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
		const places = (duration == Math.trunc(duration)) ? 0 : 1;
		const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
		this.db.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

	db_change_toType(newDBType: DBType) {
		const db = this.db_forType(newDBType);
		persistLocal.write_key(IDPersistent.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		s_db_loadTime.set(db.loadTime);
	}

	db_next_get(forward: boolean): DBType {
		switch (this.db.dbType) {
			case DBType.airtable: return forward ? DBType.local	   : DBType.firebase;
			case DBType.local:	  return forward ? DBType.firebase : DBType.airtable;
			default:			  return forward ? DBType.airtable : DBType.local;
		}
	}

	db_forType(type: string): DBInterface {
		switch (type) {
			case DBType.firebase: return dbFirebase;
			case DBType.airtable: return dbAirtable;
			default:			  return dbLocal;
		}
	}

}

export const dbDispatch = new DBDispatch();
