import { g, debug, signals, Hierarchy, IDPersistent, persistLocal } from '../common/Global_Imports';
import { s_fetch_inProgress, s_db_type, s_db_loadTime } from '../state/Reactive_State';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { DBType } from './DBInterface';
import { dbLocal } from './DBLocal';

// each db has its own hierarchy
// when switching to another db
// h is set to its hierarchy

export let h: Hierarchy;

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const type = queryStrings.get('db');
		if (!!type) {
			this.db_set_accordingToType(type);
			s_db_type.set(type);
		}
		this.db.queryStrings_apply();
	}

	constructor() {
		let done = false;
		this.db = dbFirebase;
		s_db_type.subscribe((type: string) => {
			if (!!type && (!done || (type && this.db.dbType != type))) {
				done = true;
				setTimeout(() => {
					(async () => {
						await this.hierarchy_fetch_andBuild_forDBType(type);
					})();
				}, 10);
			}
		});
	}

	async hierarchy_fetch_andBuild_forDBType(type: string) {
		persistLocal.write_key(IDPersistent.db, type);
		this.db_set_accordingToType(type);
		this.queryStrings_apply();
		if (this.db.hasData) {
			h = this.db.hierarchy;
		} else {
			const startTime = new Date().getTime();
			s_db_loadTime.set(null);
			h = this.db.hierarchy = new Hierarchy(this.db);		// create Hierarchy to fetch into
			if (this.db.isRemote) {
				g.fetch_succeeded = false;
				s_fetch_inProgress.set(true);
			}
			await this.db.fetch_all();
			await h.add_missing_removeNulls(this.db.baseID);
			h.rootAncestry_setup();
			h.ancestries_rebuildAll();
			if (this.db.isRemote) {
				this.set_loadTime(startTime);
			}
		}
		debug.log_beat('hierarchy_fetch_andBuild_forDBType before timeout');
		setTimeout(() => {
			persistLocal.restore_db_dependent(true);
			h.conclude_fetch();
			signals.signal_rebuildGraph_fromFocus();
			debug.log_beat('hierarchy_fetch_andBuild_forDBType after timeout');
		}, 1);
	}

	set_loadTime(startTime: number) {
		const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
		const places = (duration == Math.trunc(duration)) ? 0 : 1;
		const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
		this.db.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

	db_set_accordingToType(type: string) { this.db = this.db_forType(type); }
	db_change_toNext(forward: boolean) { this.db_change_toType(this.db_next_get(forward)); }

	db_change_toType(newDBType: DBType) {
		const db = this.db_forType(newDBType);
		persistLocal.write_key(IDPersistent.db, newDBType);
		s_db_type.set(newDBType);		// tell components to render the [possibly previously] fetched data
		s_db_loadTime.set(db.loadTime);
	}

	db_next_get(forward: boolean): DBType {
		switch (this.db.dbType) {
			case DBType.airtable: return forward ? DBType.local	   : DBType.firebase;
			case DBType.local:	  return forward ? DBType.firebase : DBType.airtable;
			default:			  return forward ? DBType.airtable : DBType.local;
		}
	}

	db_forType(type: string): DBInterface {
		switch (type) {
			case DBType.airtable: return dbAirtable;
			case DBType.firebase: return dbFirebase;
			default:			  return dbLocal;
		}
	}

}

export const dbDispatch = new DBDispatch();
