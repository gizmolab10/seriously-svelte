import { g, k, signals, Hierarchy, Startup_State } from '../common/Global_Imports';
import { s_db_type, s_hierarchy, s_db_loadTime } from '../state/Svelte_Stores';
import { IDPersistent, persistLocal } from '../common/Global_Imports';
import { s_startup_state } from '../state/Svelte_Stores';
import { DBType } from '../basis/PersistentIdentifiable';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import { dbLocal } from './DBLocal';
import { get } from 'svelte/store';
import { dbTest } from './DBTest';
import DBCommon from './DBCommon';

// each db has its own hierarchy
// when switching to another db
// s_hierarchy is set to its hierarchy

export function db_forType(dbType: string): DBCommon {
	switch (dbType) {
		case DBType.firebase: return dbFirebase;
		case DBType.airtable: return dbAirtable;
		case DBType.test:	  return dbTest;
		default:			  return dbLocal;
	}
}

export default class DBDispatch {
	eraseDB = false;
	db: DBCommon;

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
				setTimeout( async () => {
					await this.hierarchy_fetch_andBuild_forDBType(type);
				}, 10);
			}
		});
	}

	db_set_accordingToType(type: string) { this.db = db_forType(type); }
	db_change_toNext(forward: boolean) { this.db_change_toType(this.db_next_get(forward)); }

	restore_db() {
		let type = persistLocal.read_key(IDPersistent.db) ?? 'firebase';
		if (type == 'file') { type = 'local'; }
		s_db_type.set(type);
	}

	get startupExplanation(): string {
		const type = this.db.dbType;
		let from = k.empty;
		switch (type) {
			case DBType.firebase: from = `, from ${this.db.baseID}`; break;
			case DBType.test:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

	async hierarchy_fetch_andBuild_forDBType(type: string) {
		persistLocal.write_key(IDPersistent.db, type);
		this.db_set_accordingToType(type);
		this.queryStrings_apply();
		if (this.db.hasData) {
			const h = this.db.hierarchy;
			if (!!h) {
				s_hierarchy.set(h);
			}
		} else {
			s_startup_state.set(Startup_State.fetch);
			await this.hierarchy_fetch_andBuild();
		}
		setTimeout( async () => {
			s_startup_state.set(Startup_State.ready);
			await get(s_hierarchy).conclude_fetch();
			signals.signal_rebuildGraph_fromFocus();
		}, 1);
	}

	async hierarchy_fetch_andBuild() {
		const startTime = new Date().getTime();
		s_db_loadTime.set(null);
		const h = this.db.hierarchy = new Hierarchy(this.db);
		s_hierarchy.set(h);
		if (this.eraseDB) {
			await this.db.remove_all();	// start fresh
		}
		h.hierarchy_forgetAll();
		await this.db.fetch_all();
		await h.setup_hierarchy_after_fetch();
		if (this.db.isRemote) {
			this.set_loadTime_from(startTime);
		}
	}

	set_loadTime_from(startTime: number) {
		const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
		const places = (duration == Math.trunc(duration)) ? 0 : 1;
		const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
		this.db.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

	db_change_toType(newDBType: DBType) {
		const db = db_forType(newDBType);
		persistLocal.write_key(IDPersistent.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		s_db_loadTime.set(db.loadTime);
	}

	db_next_get(forward: boolean): DBType {
		switch (this.db.dbType) {
			case DBType.airtable: return forward ? DBType.test	   : DBType.firebase;
			case DBType.test:	  return forward ? DBType.firebase : DBType.airtable;
			default:			  return forward ? DBType.airtable : DBType.test;
		}
	}

}

export const dbDispatch = new DBDispatch();
