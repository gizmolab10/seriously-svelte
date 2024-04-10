import { g, k, TypeDB, signals, IDPersistant, persistLocal } from '../common/GlobalImports';
import { s_db_type, s_isBusy, s_db_loadTime, s_title_editing, s_path_clusterTools } from '../common/State';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;
	db_next(forward: boolean) { this.db_changeTo(this.db_get_next(forward)); }

	constructor() {
		let done = false;
		this.db = dbFirebase;
		const startTime = new Date().getTime();
		s_db_loadTime.set(null);
		s_db_type.subscribe((type: string) => {
			if (!done || (type && this.db.dbType != type)) {
				done = true;
				setTimeout(() => {
					(async () => {
						this.db_set_forType(type);
						this.queryStrings_apply();
						const h = g.hierarchy;
						await h.hierarchy_fetch_andBuild(type);
						g.rootPath_set(h.path_remember_createUnique());
						persistLocal.paths_restore(true);
						s_path_clusterTools.set(null);
						s_title_editing.set(null);
						h.hierarchy_completed(startTime);
						signals.signal_rebuildWidgets_fromHere();
					})();
				}, 1);
			}
		});
		s_db_type.set(TypeDB.firebase);
	}
	
	db_set_forType(type: string) {
		const db = this.db_forType(type);
		g.hierarchy = db.hierarchy;
		this.db = db;
	}

	queryStrings_apply() {
		const queryStrings = k.queryString;
		const type = queryStrings.get('db') ?? persistLocal.key_read(IDPersistant.db) ?? TypeDB.firebase;
		this.db_set_forType(type);
		this.db.queryStrings_apply();
		s_db_type.set(type);
	}

	db_forType(type: string): DBInterface {
		switch (type) {
			case TypeDB.airtable: return dbAirtable;
			case TypeDB.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

	db_changeTo(newDBType: TypeDB) {
		const db = this.db_forType(newDBType);
		persistLocal.key_write(IDPersistant.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		setTimeout(() => {
			if (newDBType != TypeDB.local && !db.hasData) {
				s_isBusy.set(true);			// set this before changing $s_db_type so panel will show 'loading ...'
			}
		}, 2);
		s_db_loadTime.set(db.loadTime);
	}

	db_get_next(forward: boolean): TypeDB {
		if (forward) {
			switch (this.db.dbType) {
				case TypeDB.airtable: return TypeDB.local;
				case TypeDB.local:	  return TypeDB.firebase;
				default:			  return TypeDB.airtable;
			}
		} else {
			switch (this.db.dbType) {
				case TypeDB.airtable: return TypeDB.firebase;
				case TypeDB.local:	  return TypeDB.airtable;
				default:			  return TypeDB.local;
			}
		}		
	}

}

export const dbDispatch = new DBDispatch();
