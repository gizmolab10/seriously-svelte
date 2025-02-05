import type { Async_Handle_Boolean } from '../common/Types';
import { databases } from '../managers/Databases';
import { T_Datum } from '../data/dbs/DBCommon';
import DBCommon from '../data/dbs/DBCommon';

export default class S_Persistence {
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	needsBulkFetch = false;
	type_datum: T_Datum;
	t_database: string;
	isDirty = false;
	id: string;

	updateModifyDate() { this.lastModifyDate = new Date(); }
	get isPersistent(): boolean { return this.db?.isPersistent ?? false; }
	get db(): DBCommon | null { return databases.db_forType(this.t_database); }

	constructor(t_database: string, type_datum: T_Datum, id: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.already_persisted = already_persisted;
		this.awaitingCreation  = awaitingCreation;
		this.type_datum		   = type_datum;
		this.t_database		   = t_database;			// needed for this.isPersistent, used next
		this.isDirty		   = this.isPersistent && !already_persisted;
		this.id				   = id;
	}

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.log('slow: needs remote save');
		}
		return result;
	}

	async persist_withClosure(closure: Async_Handle_Boolean) {
		if (this.isPersistent) {
			if (this.awaitingCreation) {
				console.log(`awaiting creation ${this.type_datum} ${this.id}`);
			} else {
				this.updateModifyDate();
				await closure(this.already_persisted);
			}
		}
	}

}