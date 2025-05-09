import type { Async_Handle_Boolean } from '../common/Types';
import { E_Persistable } from '../database/DBCommon';
import { databases } from '../database/Databases';
import DBCommon from '../database/DBCommon';

export default class S_Persistence {
	e_persistable: E_Persistable;
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	needsBulkFetch = false;
	e_database: string;
	isDirty = false;
	id: string;

	updateModifyDate() { this.lastModifyDate = new Date(); }
	get isPersistent(): boolean { return this.db?.isPersistent ?? false; }
	get db(): DBCommon | null { return databases.db_forType(this.e_database); }

	constructor(e_database: string, e_persistable: E_Persistable, id: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.already_persisted = already_persisted;
		this.awaitingCreation  = awaitingCreation;
		this.e_persistable	   = e_persistable;
		this.e_database		   = e_database;			// needed for this.isPersistent, used next
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
				console.log(`awaiting creation ${this.e_persistable} ${this.id}`);
			} else {
				this.updateModifyDate();
				await closure(this.already_persisted);
			}
		}
	}

}