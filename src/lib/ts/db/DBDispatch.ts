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

	queryString_apply() {
		const queryString = g.queryString;
		const type = queryString.get('db');
		if (!!type) {
			this.db_set_accordingToType(type);
			s_db_type.set(type);
		}
		this.db.queryString_apply();
	}

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_db_type.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db.dbType != type))) {
				done = true;
				setTimeout( async () => {
					await this.hierarchy_setup_fetch_andBuild_forDBType(type);
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

	async hierarchy_setup_fetch_andBuild_forDBType(type: string) {
		persistLocal.write_key(IDPersistent.db, type);
		this.db_set_accordingToType(type);
		this.queryString_apply();
		if (this.db.hasData) {
			const h = this.db.hierarchy;
			if (!!h) {
				s_hierarchy.set(h);
				h.reset_hierarchy();
			}
		} else {
			s_startup_state.set(Startup_State.fetch);
			await this.hierarchy_create_fetch_andBuild();
		}
		setTimeout( async () => {
			s_startup_state.set(Startup_State.ready);
			signals.signal_rebuildGraph_fromFocus();
		}, 1);
	}

	async hierarchy_create_fetch_andBuild() {
		s_db_loadTime.set(null);
		const startTime = new Date().getTime();
		const db = this.db;
		const h = db.hierarchy = new Hierarchy(db);
		s_hierarchy.set(h);
		if (this.eraseDB) {
			await db.remove_all();	// start fresh
		}
		h.hierarchy_forgetAll();
		await db.fetch_all();
		await h.conclude_fetch_andPersist();
		if (db.isRemote) {
			this.set_loadTime_from(startTime);
		}
	}

	set_loadTime_from(startTime: number) {
		const duration = (new Date().getTime()) - startTime;
		const adjusted = Math.trunc(duration / 100) / 10;
		const isInteger = adjusted == Math.trunc(adjusted);
		const places = isInteger ? 0 : 1;
		const suffix = isInteger ? '' : 's';
		const time = (duration / 1000).toFixed(places);
		const loadTime = `${time} second${suffix}`
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
