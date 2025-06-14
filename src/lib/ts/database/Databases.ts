import { c, Hierarchy, k, p, T_Preference } from '../common/Global_Imports';
import { w_hierarchy, w_t_database } from '../common/Stores';
import { T_Persistence } from '../common/Global_Imports';
import { T_Database } from '../database/DBCommon';
import DBCommon from '../database/DBCommon';
import DBFirebase from './DBFirebase';
import DBAirtable from './DBAirtable';
import DBLocal from './DBLocal';
import DBTest from './DBTest';
// import DBDGraph from './DBDGraph';

// each db has its own hierarchy
// when switching to another db
// w_hierarchy is set to its hierarchy

export default class Databases {
	private dbCache: { [key: string]: DBCommon } = {};
	defer_persistence: boolean = false;
	db_now: DBCommon;

	queryStrings_apply() {
		const queryStrings = c.queryStrings;
		let type = queryStrings.get('db');
		if (!!type) {
			this.db_now = this.db_forType(type);
		} else {
			type = p.read_key(T_Preference.db) ?? 'firebase';
			if (type == 'file') { type = 'local'; }
		}
		w_t_database.set(type!);
	}

	constructor() {
		let done = false;
		this.db_now = this.db_forType(T_Database.firebase);
		w_t_database.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db_now.t_database != type))) {
				done = true;
				setTimeout( async () => {	// wait for hierarchy to be created
					await this.grand_change_database(type);
				}, 0);
			}
		});
	}

	async grand_change_database(type: string) {
		this.db_now = this.db_forType(type);
		let h = this.db_now.hierarchy;
		if (!h) {
			this.db_now.hierarchy = h;
			h = new Hierarchy(this.db_now);
		}
		p.write_key(T_Preference.db, type);
		w_hierarchy.set(h);
		w_t_database.set(type);
		await this.db_now.hierarchy_setup_fetch_andBuild();
	}

	db_change_toNext(forward: boolean) { w_t_database.set(this.db_next_get(forward)); }
	isRemote(t_persistence: T_Persistence): boolean { return t_persistence == T_Persistence.remote; }
	isPersistent(t_persistence: T_Persistence): boolean { return t_persistence != T_Persistence.none; }

	db_next_get(forward: boolean): T_Database {
		switch (this.db_now.t_database) {
			case T_Database.local:    return forward ? T_Database.firebase : T_Database.test;
			case T_Database.firebase: return forward ? T_Database.airtable : T_Database.local;
			case T_Database.airtable: return forward ? T_Database.dgraph   : T_Database.firebase;
			case T_Database.dgraph:   return forward ? T_Database.test     : T_Database.airtable;
			default:                  return forward ? T_Database.local     : T_Database.dgraph;
		}
	}

	db_forType(t_database: string): DBCommon {
		if (!this.dbCache[t_database]) {
			switch (t_database) {
				case T_Database.firebase: this.dbCache[t_database] = new DBFirebase(); break;
				case T_Database.airtable: this.dbCache[t_database] = new DBAirtable(); break;
				case T_Database.local:    this.dbCache[t_database] = new DBLocal(); break;
				// case T_Database.dgraph:   this.dbCache[t_database] = new DBDGraph(); break;
				default:                  this.dbCache[t_database] = new DBTest(); break;
			}
		}
		return this.dbCache[t_database];
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
