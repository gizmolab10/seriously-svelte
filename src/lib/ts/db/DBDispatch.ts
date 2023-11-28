import { db_type, isBusy, id_here, ids_grabbed, db_loadTime, things_arrived } from '../managers/State';
import { DBType, PersistID, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;
	updateDBForType(type: string) { this.db = this.dbForType(type); }
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }

	constructor() {
		this.db = dbFirebase;
		db_type.subscribe((type: string) => {
			if (type) {
				id_here.set(null);
				ids_grabbed.set([]);
				this.updateDBForType(type);
				this.updateHierarchy(type);
			}
		});
	}

	applyQueryStrings(params: URLSearchParams) {
		if (params.get('data') === 'erase') {
			this.eraseDB = true;
		}
		const type = params.get('db') ?? persistLocal.readFromKey(PersistID.db) ?? DBType.firebase;
		this.dbForType(type).applyQueryStrings(params)
		db_type.set(type);	// invokes DB update (line 22 above), which needs baseID already set (must be above)
	}

	dbForType(type: string): DBInterface {
		switch (type) {
			case DBType.airtable: return dbAirtable;
			case DBType.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

	changeDBTo(newDBType: DBType) {
		const db = this.dbForType(newDBType);
		db_loadTime.set(db.loadTime);
		persistLocal.writeToKey(PersistID.db, newDBType);
		if (newDBType != DBType.local && !db.hasData) {
			isBusy.set(true);			// set this before changing $db_type so panel will show 'loading ...'
		}
		db_type.set(newDBType);			// tell components to render the [possibly previously] fetched data
	}

	getNextDB(forward: boolean): DBType {
		if (forward) {
			switch (this.db.db_type) {
				case DBType.airtable: return DBType.local;
				case DBType.local:	  return DBType.firebase;
				default:			  return DBType.airtable;
			}
		} else {
			switch (this.db.db_type) {
				case DBType.airtable: return DBType.firebase;
				case DBType.local:	  return DBType.airtable;
				default:			  return DBType.local;
			}
		}		
	}

	updateHierarchy(type: string) {
		const h = this.db.hierarchy;
		if (this.db.hasData) {
			persistLocal.state_updateForDBType(type, h.idRoot!);
			h.here_restore();
		} else {
			if (type != DBType.local) {
				isBusy.set(true);
				things_arrived.set(false);
			}
			(async () => {							// this will happen when local sets db_type !!! too early?
				db_loadTime.set(null);
				const startTime = new Date().getTime();
				await this.db.fetch_all();
				h.hierarchy_assemble(type);
				const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
				const places = (duration == Math.trunc(duration)) ? 0 : 1;
				const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
				this.db.loadTime = loadTime;
				db_loadTime.set(loadTime);
			})();
		}
	}

}

export const dbDispatch = new DBDispatch();
