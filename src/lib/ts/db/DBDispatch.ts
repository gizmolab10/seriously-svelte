import { dbType, isBusy, idHere, idsGrabbed, dbLoadTime, thingsArrived } from '../managers/State';
import { DBType, PersistID, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	bulkName: string;
	eraseDB = false;
	updateDBForType(type: string) { this.db = this.dbForType(type); }
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }

	constructor() {
		this.db = dbFirebase;
		this.bulkName = 'Public';
		dbType.subscribe((type: string) => {
			if (type) {
				idHere.set(null);
				idsGrabbed.set([]);
				this.updateDBForType(type);
				this.updateHierarchy(type);
			}
		});
	}

	applyQueryStrings(params: URLSearchParams) {
		if (params.get('data') === 'erase') {
			this.eraseDB = true;
		}
		this.bulkName = params.get('name') ?? 'Public';
		const type = params.get('db') ?? persistLocal.readFromKey(PersistID.db) ?? DBType.firebase;
		dbType.set(type);	// invokes cloud setup, which needs bulk name already set (must be above)
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
		dbLoadTime.set(db.loadTime);
		persistLocal.writeToKey(PersistID.db, newDBType);
		if (newDBType != DBType.local && !db.hasData) {
			isBusy.set(true);			// set this before changing $dbType so panel will show 'loading ...'
		}
		dbType.set(newDBType);			// tell components to render the [possibly previously] fetched data
	}

	getNextDB(forward: boolean): DBType {
		if (forward) {
			switch (this.db.dbType) {
				case DBType.airtable: return DBType.local;
				case DBType.local:	  return DBType.firebase;
				default:			  return DBType.airtable;
			}
		} else {
			switch (this.db.dbType) {
				case DBType.airtable: return DBType.firebase;
				case DBType.local:	  return DBType.airtable;
				default:			  return DBType.local;
			}
		}		
	}

	updateHierarchy(type: string) {
		const h = this.db.hierarchy;
		if (this.db.hasData) {
			persistLocal.state_updateFor(type, h.idRoot!);
			h.here_restore();
		} else {
			if (type != DBType.local) {
				isBusy.set(true);
				thingsArrived.set(false);
			}
			(async () => {							// this will happen when local sets dbType !!! too early?
				dbLoadTime.set(null);
				const startTime = new Date().getTime();
				await this.db.fetch_all();
				h.hierarchy_construct(type);
				const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
				const places = (duration == Math.trunc(duration)) ? 0 : 1;
				const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
				this.db.loadTime = loadTime;
				dbLoadTime.set(loadTime);
			})();
		}
	}

}

export const dbDispatch = new DBDispatch();
