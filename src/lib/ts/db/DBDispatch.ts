import { s_db_type, s_isBusy, s_path_here, s_paths_grabbed, s_db_loadTime, s_things_arrived } from '../managers/State';
import { k, TypeDB, IDPersistant, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;
	updateDBForType(type: string) { this.db = this.dbForType(type); }
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }

	constructor() { this.db = dbFirebase; }

	applyQueryStrings(queryStrings: URLSearchParams) {
		const type = queryStrings.get('db') ?? persistLocal.readFromKey(IDPersistant.db) ?? TypeDB.firebase;
		this.updateDBForType(type);
		this.db.applyQueryStrings(queryStrings);
		s_db_type.set(type);
		this.updateHierarchy(type);
		s_db_type.subscribe((type: string) => {
			if (type && this.db.dbType != type) {
				s_path_here.set(k.rootPath);
				s_paths_grabbed.set([]);
				this.updateDBForType(type);
				this.updateHierarchy(type);
			}
		});
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
		s_db_loadTime.set(db.loadTime);
		persistLocal.writeToKey(IDPersistant.db, newDBType);
		if (newDBType != TypeDB.local && !db.hasData) {
			s_isBusy.set(true);			// set this before changing $s_db_type so panel will show 'loading ...'
		}
		s_db_type.set(newDBType);			// tell components to render the [possibly previously] fetched data
	}

	getNextDB(forward: boolean): TypeDB {
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

	updateHierarchy(type: string) {
		const h = this.db.hierarchy;
		if (this.db.hasData) {
			h.here_restore();
		} else {
			if (type != TypeDB.local) {
				s_isBusy.set(true);
				s_things_arrived.set(false);
			}
			(async () => {							// this will happen when local sets s_db_type !!! too early?
				s_db_loadTime.set(null);
				const startTime = new Date().getTime();
				await this.db.fetch_all();
				h.hierarchy_assemble(type);
				const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
				const places = (duration == Math.trunc(duration)) ? 0 : 1;
				const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
				this.db.loadTime = loadTime;
				s_db_loadTime.set(loadTime);
			})();
		}
	}

}

export const dbDispatch = new DBDispatch();
