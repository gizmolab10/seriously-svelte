import { g, k, TypeDB, signals, IDPersistant, persistLocal } from '../common/GlobalImports';
import { s_db_type, s_isBusy, s_db_loadTime, s_title_editing, s_path_graphTools } from '../common/State';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;

	queryStrings_apply() {
		const queryStrings = k.queryString;
		const type = queryStrings.get('db') ?? persistLocal.key_read(IDPersistant.db) ?? TypeDB.firebase;
		this.db_changeTo_for(type);
		this.db.queryStrings_apply();
		s_db_type.set(type);
	}

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
						this.db_changeTo_type(type)
						g.hierarchy.hierarchy_completed(startTime);
					})();
				}, 1);
			}
		});
		s_db_type.set(TypeDB.firebase);
	}

	async db_changeTo_type(type: string) {
		this.db_changeTo_for(type);
		this.queryStrings_apply();
		await g.hierarchy.hierarchy_fetch_andBuild(type);
		persistLocal.paths_restore(true);
		s_path_graphTools.set(null);
		s_title_editing.set(null);
		signals.signal_rebuildWidgets_fromFocus();
	}

	db_changeTo_next(forward: boolean) { this.db_changeTo(this.db_next_get(forward)); }
	
	db_changeTo_for(type: string) {
		const db = this.db_forType(type);
		g.hierarchy = db.hierarchy;
		this.db = db;
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

	db_next_get(forward: boolean): TypeDB {
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

	db_forType(type: string): DBInterface {
		switch (type) {
			case TypeDB.airtable: return dbAirtable;
			case TypeDB.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

}

export const dbDispatch = new DBDispatch();
