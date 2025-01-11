import { g, k, IDPersistent, persistLocal } from '../common/Global_Imports';
import { s_db_type, s_db_loadTime } from '../state/Svelte_Stores';
import { DBType } from '../basis/PersistentIdentifiable';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import { dbLocal } from './DBLocal';
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
					persistLocal.write_key(IDPersistent.db, type);
					this.db_set_accordingToType(type);
					await this.db.hierarchy_setup_fetch_andBuild();
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
