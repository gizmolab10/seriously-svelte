import { g, k, T_Preference, preferences } from '../common/Global_Imports';
import { dbFirebase } from '../data/dbs/DBFirebase';
import { dbAirtable } from '../data/dbs/DBAirtable';
import { T_Database } from '../data/dbs/DBCommon';
import { s_type_db } from '../state/S_Stores';
import { dbLocal } from '../data/dbs/DBLocal';
import { dbTest } from '../data/dbs/DBTest';
import DBCommon from '../data/dbs/DBCommon';

// each db has its own hierarchy
// when switching to another db
// s_hierarchy is set to its hierarchy

export function db_forType(type_db: string): DBCommon {
	switch (type_db) {
		case T_Database.firebase: return dbFirebase;
		case T_Database.airtable: return dbAirtable;
		case T_Database.test:	  return dbTest;
		default:			  return dbLocal;
	}
}

export default class Databases {
	db: DBCommon;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const type = queryStrings.get('db');
		if (!!type) {
			this.db_set_accordingToType(type);
			s_type_db.set(type);
		}
		this.db.queryStrings_apply();
	}

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_type_db.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db.type_db != type))) {
				done = true;
				setTimeout( async () => {
					preferences.write_key(T_Preference.db, type);
					this.db_set_accordingToType(type);
					await this.db.hierarchy_setup_fetch_andBuild();
				}, 10);
			}
		});
	}

	db_set_accordingToType(type: string) { this.db = db_forType(type); }
	db_change_toNext(forward: boolean) { this.db_change_toType(this.db_next_get(forward)); }

	restore_db() {
		let type = preferences.read_key(T_Preference.db) ?? 'firebase';
		if (type == 'file') { type = 'local'; }
		s_type_db.set(type);
	}

	get startupExplanation(): string {
		const type = this.db.type_db;
		let from = k.empty;
		switch (type) {
			case T_Database.firebase: from = `, from ${this.db.idBase}`; break;
			case T_Database.test:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

	db_change_toType(newDatabaseType: T_Database) {
		const db = db_forType(newDatabaseType);
		preferences.write_key(T_Preference.db, newDatabaseType);
		s_type_db.set(newDatabaseType);		// tell components to render the [possibly previously] fetched data
	}

	db_next_get(forward: boolean): T_Database {
		switch (this.db.type_db) {
			case T_Database.airtable: return forward ? T_Database.test	   : T_Database.firebase;
			case T_Database.test:	  return forward ? T_Database.firebase : T_Database.airtable;
			default:			  	  return forward ? T_Database.airtable : T_Database.test;
		}
	}

}

export const databases = new Databases();
