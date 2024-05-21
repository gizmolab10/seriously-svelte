import { g, k, debug, signals, Hierarchy, IDPersistant, persistLocal } from '../common/GlobalImports';
import { s_isBusy, s_db_type, s_db_loadTime, s_title_editing } from '../state/State';
import { s_things_arrived, s_ancestry_editingTools } from '../state/State';
import { idDefault } from "../structures/Identifiable";
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { DBType } from './DBInterface';
import { dbLocal } from './DBLocal';

// each db has its own hierarchy
// when switching to another db
// h is set to its hierarchy

export let h: Hierarchy;

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;

	queryStrings_apply() {
		const queryStrings = k.queryString;
		const type = queryStrings.get('db') ?? persistLocal.key_read(IDPersistant.db) ?? DBType.firebase;
		this.db_changeTypeTo_for(type);
		this.db.queryStrings_apply();
		s_db_type.set(type);
	}

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_db_type.subscribe((type: string) => {
			if (!done || (type && this.db.dbType != type)) {
				done = true;
				setTimeout(() => {
					(async () => {
						this.db_setupData_forType(type);
					})();
				}, 1);
			}
		});
	}

	async db_setupData_forType(type: string) {
		this.db_changeTypeTo_for(type);
		this.queryStrings_apply();
		await this.hierarchy_fetch_andBuild(type);
		persistLocal.ancestries_restore(true);
		s_ancestry_editingTools.set(null);
		s_title_editing.set(null);
		h.hierarchy_markAsCompleted();
		signals.signal_rebuildGraph_fromFocus();
		debug.log_beat('db_setupData_forType before timeout');
		setTimeout(() => {
			debug.log_beat('db_setupData_forType after timeout');
		}, 1);
	}

	async hierarchy_fetch_andBuild(type: string) {
		if (this.db.hasData) {
			h = this.db.hierarchy;
		} else {
			const startTime = new Date().getTime();
			s_db_loadTime.set(null);
			if (this.db.isRemote) {
				s_things_arrived.set(false);
				s_isBusy.set(true);
			}
			h = this.db.hierarchy = new Hierarchy(this.db);		// create Hierarchy to fetch into
			await this.db.fetch_all();
			await h.add_missing_removeNulls(idDefault, this.db.baseID);
			h.rootAncestry_setup();
			h.ancestries_rebuildAll();
			if (this.db.isRemote) {
				this.set_loadTime(startTime);
			}
		}
	}

	set_loadTime(startTime: number) {
		const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
		const places = (duration == Math.trunc(duration)) ? 0 : 1;
		const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
		this.db.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

	db_changeTypeTo_for(type: string) { this.db = this.db_forType(type); }
	db_change_toNext(forward: boolean) { this.db_change_toType(this.db_next_get(forward)); }

	db_change_toType(newDBType: DBType) {
		const db = this.db_forType(newDBType);
		persistLocal.key_write(IDPersistant.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		setTimeout(() => {
			if (newDBType != DBType.local && !db.hasData) {
				s_isBusy.set(true);			// set this before changing $s_db_type so panel will show 'loading ...'
			}
		}, 2);
		s_db_loadTime.set(db.loadTime);
	}

	db_next_get(forward: boolean): DBType {
		if (forward) {
			switch (this.db.dbType) {
				case DBType.airtable: return DBType.local;
				case DBType.local:	  return DBType.firebase;
				default:			  return DBType.airtable;
			}
		} else {
			switch (this.db.dbType) {
				case DBType.airtable: return DBType.firebase;
				case DBType.local:	  return DBType.airtable;
				default:			  return DBType.local;
			}
		}		
	}

	db_forType(type: string): DBInterface {
		switch (type) {
			case DBType.airtable: return dbAirtable;
			case DBType.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

}

export const dbDispatch = new DBDispatch();
