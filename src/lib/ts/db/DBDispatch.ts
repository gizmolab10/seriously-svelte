import { dbType, isBusy, idHere, idsGrabbed, dbLoadTime, thingsArrived } from '../managers/State';
import { DBType, Relationship, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;

	constructor() {
		this.db = dbFirebase;
		persistLocal.okayToWrite = true;
		dbType.subscribe((type: string) => {
			if (type) {
				idHere.set(null);
				idsGrabbed.set([]);
				this.updateDBForType(type);
				this.updateHierarchy(type);
			}
		})
	}

	updateDBForType(type: string) { this.db = this.dbForType(type); }

	dbForType(type: string): DBInterface {
		switch (type) {
			case DBType.airtable:	return dbAirtable;
			case DBType.firebase: return dbFirebase;
			default:							return dbLocal;
		}
	}

	updateHierarchy(type: string) {
		const h = this.db.hierarchy;
		if (this.db.hasData) {
			persistLocal.setupDBFor(type, this.db.hierarchy.idRoot!);
			h.restoreHere();
		} else {
			if (type != DBType.local) {
				isBusy.set(true);				// also used by Details when changing dbType
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

	async relationship_remoteWrite(relationship: Relationship) {
		if (!relationship.awaitingCreation) {
			if (relationship.isRemotelyStored) {
				await this.db.relationship_remoteUpdate(relationship);
			} else {
				await this.db.relationship_remoteCreate(relationship);
			}
		}
	}
}

export const dbDispatch = new DBDispatch();
