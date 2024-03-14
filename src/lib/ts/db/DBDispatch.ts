import { s_db_type, s_isBusy, s_db_loadTime, s_things_arrived } from '../common/State';
import { g, TypeDB, IDPersistant, persistLocal } from '../common/GlobalImports';
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

	async applyQueryStrings(queryStrings: URLSearchParams) {
		const type = queryStrings.get('db') ?? persistLocal.readFromKey(IDPersistant.db) ?? TypeDB.firebase;
		this.updateDBForType(type);
		this.db.applyQueryStrings(queryStrings);
		s_db_type.set(type);
		await this.updateHierarchy(type);
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
		persistLocal.writeToKey(IDPersistant.db, newDBType);
		if (newDBType != TypeDB.local && !db.hasData) {
			s_isBusy.set(true);			// set this before changing $s_db_type so panel will show 'loading ...'
		}
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		s_db_loadTime.set(db.loadTime);
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

	async updateHierarchy(type: string) {
		g.hierarchy = this.db.hierarchy;				// called when local sets s_db_type
		const h = g.hierarchy;
		if (this.db.hasData) {
			persistLocal.paths_restore();
		} else {
			if (type != TypeDB.local) {
				s_isBusy.set(true);
				s_things_arrived.set(false);
			}
			s_db_loadTime.set(null);
			const startTime = new Date().getTime();
			await this.db.fetch_all();
			h.hierarchy_assemble(type);
			const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
			const places = (duration == Math.trunc(duration)) ? 0 : 1;
			const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
			this.db.loadTime = loadTime;
			s_db_loadTime.set(loadTime);
		}
	}

}

export const dbDispatch = new DBDispatch();
