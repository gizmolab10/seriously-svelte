import { c, k, E_Preference, p } from '../common/Global_Imports';
import { E_Database, E_Persistence } from '../database/DBCommon';
import { dbAirtable } from '../database/DBAirtable';
import { dbFirebase } from '../database/DBFirebase';
import { w_e_database } from '../common/Stores';
import { dbLocal } from '../database/DBLocal';
import { dbTest } from '../database/DBTest';
import DBCommon from '../database/DBCommon';

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
			w_e_database.set(type);
		}
		this.db_now.queryStrings_apply();
	}

	constructor() {
		let done = false;
		this.db_now = dbFirebase;
		w_e_database.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db_now.e_database != type))) {
				done = true;
				setTimeout( async () => {
					this.db_set_accordingToType(type);
					p.write_key(E_Preference.db, type);
					await this.db_now.hierarchy_setup_fetch_andBuild();
				}, 0);
			}
		});
	}

	db_set_accordingToType(type: string) { this.db_now = this.db_forType(type); }
	db_change_toNext(forward: boolean) { w_e_database.set(this.db_next_get(forward)); }
	isRemote(kind_persistence: E_Persistence): boolean { return kind_persistence == E_Persistence.remote; }
	isPersistent(kind_persistence: E_Persistence): boolean { return kind_persistence != E_Persistence.none; }

	restore_db() {
		let type = p.read_key(E_Preference.db) ?? 'firebase';
		if (type == 'file') { type = 'local'; }
		w_e_database.set(type);
	}

	db_next_get(forward: boolean): E_Database {
		switch (this.db_now.e_database) {
			case E_Database.local:	  return forward ? E_Database.firebase : E_Database.test;
			case E_Database.firebase: return forward ? E_Database.airtable : E_Database.local;
			case E_Database.airtable: return forward ? E_Database.test	   : E_Database.firebase;
			default:				  return forward ? E_Database.local	   : E_Database.airtable;
		}
	}

	db_forType(e_database: string): DBCommon {
		switch (e_database) {
			case E_Database.firebase: return dbFirebase;
			case E_Database.airtable: return dbAirtable;
			case E_Database.local:	  return dbLocal;
			default:				  return dbTest;
		}
	}

	get startupExplanation(): string {
		const type = this.db_now.e_database;
		let from = k.empty;
		switch (type) {
			case E_Database.firebase: from = `, from ${this.db_now.idBase}`; break;
			case E_Database.test:	  return k.empty;
		}
		return `(loading your ${type} data${from})`;
	}

}

export const databases = new Databases();
