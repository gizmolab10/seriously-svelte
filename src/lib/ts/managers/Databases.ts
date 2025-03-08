import { c, k, T_Preference, p } from '../common/Global_Imports';
import { T_Database, T_Persistence } from '../data/dbs/DBCommon';
import { dbAirtable } from '../data/dbs/DBAirtable';
import { dbFirebase } from '../data/dbs/DBFirebase';
import { w_t_database } from '../common/Stores';
import { dbLocal } from '../data/dbs/DBLocal';
import { dbTest } from '../data/dbs/DBTest';
import DBCommon from '../data/dbs/DBCommon';

// each db has its own hierarchy
// when switching to another db
// w_hierarchy is set to its hierarchy

export default class Databases {
	db_now: DBCommon;

	queryStrings_apply() {
		const queryStrings = c.queryStrings;
		const type = queryStrings.get('db');
		if (!!type) {
			this.db_set_accordingToType(type);
			w_t_database.set(type);
		}
		this.db_now.queryStrings_apply();
	}

	constructor() {
		let done = false;
		this.db_now = dbFirebase;
		w_t_database.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db_now.t_database != type))) {
				done = true;
				setTimeout( async () => {
					this.db_set_accordingToType(type);
					p.write_key(T_Preference.db, type);
					await this.db_now.hierarchy_setup_fetch_andBuild();
				}, 0);
			}
		});
	}

	db_set_accordingToType(type: string) { this.db_now = this.db_forType(type); }
	db_change_toNext(forward: boolean) { w_t_database.set(this.db_next_get(forward)); }
	isRemote(kind_persistence: T_Persistence): boolean { return kind_persistence == T_Persistence.remote; }
	isPersistent(kind_persistence: T_Persistence): boolean { return kind_persistence != T_Persistence.none; }

	restore_db() {
		let type = p.read_key(T_Preference.db) ?? 'firebase';
		if (type == 'file') { type = 'local'; }
		w_t_database.set(type);
	}

	db_next_get(forward: boolean): T_Database {
		switch (this.db_now.t_database) {
			case T_Database.local:	  return forward ? T_Database.firebase : T_Database.test;
			case T_Database.firebase: return forward ? T_Database.airtable : T_Database.local;
			case T_Database.airtable: return forward ? T_Database.test	   : T_Database.firebase;
			default:				  return forward ? T_Database.local	   : T_Database.airtable;
		}
	}

	db_forType(t_database: string): DBCommon {
		switch (t_database) {
			case T_Database.firebase: return dbFirebase;
			case T_Database.airtable: return dbAirtable;
			case T_Database.local:	  return dbLocal;
			default:				  return dbTest;
		}
	}

	get startupExplanation(): string {
		const type = this.db_now.t_database;
		let from = k.empty;
		switch (type) {
			case T_Database.firebase: from = `, from ${this.db_now.idBase}`; break;
			case T_Database.test:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

}

export const databases = new Databases();
