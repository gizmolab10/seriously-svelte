import { s_db_type, s_isBusy, s_db_loadTime, s_path_here, s_paths_grabbed, s_paths_expanded, s_path_toolsCluster } from '../common/State';
import { g, k, TypeDB, signals, IDPersistant, persistLocal } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
	db: DBInterface;
	eraseDB = false;
	nextDB(forward: boolean) { this.changeDBTo(this.getNextDB(forward)); }
	updateDBForType(type: string) { this.db = this.dbForType(type); g.hierarchy = this.db.hierarchy; }

	constructor() {
		let done = false;
		this.db = dbFirebase;
		setTimeout(() => {
			if (!done) {
				done = true;
				this.setup(TypeDB.firebase);
			}
		}, 1);

		s_db_type.subscribe((type: string) => {
			if (type && this.db.dbType != type) {
				this.setup(type);
				signals.signal_rebuildWidgets_fromHere();
			}
		});
	}

	setup(type: string) {
		this.updateDBForType(type);
		(async () => {
			await this.applyQueryStrings();
			await g.hierarchy.hierarchy_fetchAndBuild(type);
			g.rootPath = this.db.hierarchy.path_remember_unique();
			s_paths_grabbed.set([]);
			s_path_here.set(g.rootPath);
			s_path_toolsCluster.set(null);
			s_paths_expanded.set([g.rootPath]);
		})()
	}

	async applyQueryStrings() {
		const queryStrings = k.queryString;
		const type = queryStrings.get('db') ?? persistLocal.readFromKey(IDPersistant.db) ?? TypeDB.firebase;
		this.updateDBForType(type);
		this.db.applyQueryStrings();
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

}

export const dbDispatch = new DBDispatch();
