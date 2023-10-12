import { dbType, isBusy, idHere, idsGrabbed, dbLoadTime, thingsArrived } from '../managers/State';
import { get, DBType, PersistID, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	bulkName: string;
	okayToWrite = false;
	updateDBForType(type: string) { this.db = this.dbForType(type); }
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }

	constructor() {
		this.db = dbFirebase;
		this.okayToWrite = true;
		this.bulkName = 'Public';
		dbType.subscribe((type: string) => {
			if (type) {
				idHere.set(null);
				idsGrabbed.set([]);
				this.updateDBForType(type);
				this.updateHierarchy(type);
			}
		})
		setTimeout(() => {
			idsGrabbed.subscribe((ids: Array<string>) => {
				if (this.okayToWrite) {
					const here = this.db.hierarchy.here;
					if (ids && here) {
						persistLocal.writeToKeys(PersistID.db, here.id, this.db.dbType, get(idsGrabbed))
					}
				}
			});
		}, 1);
	}

	applyQueryStrings(params: URLSearchParams) {
		this.bulkName = params.get('name') ?? 'Public';
		const type = params.get('db') ?? persistLocal.readFromKey(PersistID.db) ?? DBType.firebase;
		dbType.set(type); // invokes cloud setup, which needs bulk name already set (must be above)
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
			isBusy.set(true);		// set this before changing $dbType so panel will show 'loading ...'
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
			this.updateStateFor(type, this.db.hierarchy.idRoot!);
			h.restoreHere();
		} else {
			if (type != DBType.local) {
				isBusy.set(true);
				thingsArrived.set(false);
			}
			(async () => {							// this will happen when Local sets dbType !!! too early?
				dbLoadTime.set(null);
				const startTime = new Date().getTime();
				await this.db.setupDB();
				h.constructHierarchy(type);
				const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
				const places = (duration == Math.trunc(duration)) ? 0 : 1;
				const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
				this.db.loadTime = loadTime;
				dbLoadTime.set(loadTime);
			})();
		}
	}

	updateStateFor(type: string, defaultIDHere: string) {
		const dbValues = persistLocal.readFromKeys(PersistID.db, type);
		if (dbValues == null) {
			idHere.set(defaultIDHere);
			idsGrabbed.set([defaultIDHere]);
		} else {
			this.okayToWrite = false;
			idHere.set(dbValues[0]);
			idsGrabbed.set(dbValues[1]);
			this.okayToWrite = true;
		}
	}

}

export const dbDispatch = new DBDispatch();
