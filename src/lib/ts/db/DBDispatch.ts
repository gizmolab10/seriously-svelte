import { g, k, TypeDB, signals, IDPersistant, persistLocal } from '../common/GlobalImports';
import { s_db_type, s_isBusy, s_db_loadTime, s_title_editing, s_path_toolsCluster } from '../common/State';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_db_type.subscribe((type: string) => {
			if (!done || (type && this.db.dbType != type)) {
				done = true;
				setTimeout(() => {
					(async () => {
						this.updateDBForType(type);
						this.queryStrings_apply();
						await g.hierarchy.hierarchy_fetchAndBuild(type);
						g.rootPath = g.hierarchy.path_remember_unique();
						persistLocal.paths_restore(true);
						s_path_toolsCluster.set(null);
						s_title_editing.set(null);
						signals.signal_rebuildWidgets_fromHere();
					})();
				}, 1);
			}
		});
		s_db_type.set(TypeDB.firebase);
	}
	
	updateDBForType(type: string) {
		const db = this.dbForType(type);
		g.hierarchy = db.hierarchy;
		this.db = db;
	}

	queryStrings_apply() {
		const queryStrings = k.queryString;
		const type = queryStrings.get('db') ?? persistLocal.key_read(IDPersistant.db) ?? TypeDB.firebase;
		this.updateDBForType(type);
		this.db.queryStrings_apply();
		s_db_type.set(type);
	}

	dbForType(type: string): DBInterface {
		switch (type) {
			case TypeDB.airtable: return dbAirtable;
			case TypeDB.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

	changeDBTo(newDBType: TypeDB) {
		const db = this.dbForType(newDBType);
		persistLocal.key_write(IDPersistant.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		setTimeout(() => {
			if (newDBType != TypeDB.local && !db.hasData) {
				s_isBusy.set(true);			// set this before changing $s_db_type so panel will show 'loading ...'
			}
		}, 2);
		s_db_loadTime.set(db.loadTime);
	}

	getNextDB(forward: boolean): TypeDB {
		if (forward) {
			switch (this.db.dbType) {
				case TypeDB.local:	  return TypeDB.firebase;
				default:			  return TypeDB.local;
				// case TypeDB.airtable: return TypeDB.local;
				// default:			  return TypeDB.airtable;
			}
		} else {
			switch (this.db.dbType) {
				case TypeDB.local:	  return TypeDB.firebase;
				default:			  return TypeDB.local;
				// case TypeDB.airtable: return TypeDB.firebase;
				// case TypeDB.local:	  return TypeDB.airtable;
			}
		}		
	}

}

export const dbDispatch = new DBDispatch();
