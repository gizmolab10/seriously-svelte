import type { Async_Handle_Boolean } from '../common/Types';
import { T_Persistable } from '../database/DBCommon';
import { databases } from '../database/Databases';
import DBCommon from '../database/DBCommon';

export default class S_Persistence {
	t_persistable: T_Persistable;
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	needsBulkFetch = false;
	t_database: string;
	isDirty = false;
	id: string;

	updateModifyDate() { this.lastModifyDate = new Date(); }
	get isPersistent(): boolean { return this.db?.isPersistent ?? false; }
	get db(): DBCommon | null { return databases.db_forType(this.t_database); }

	constructor(t_database: string, t_persistable: T_Persistable, id: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.already_persisted = already_persisted;
		this.awaitingCreation  = awaitingCreation;
		this.t_persistable	   = t_persistable;
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
				console.log(`awaiting creation ${this.t_persistable} ${this.id}`);
			} else {
				this.updateModifyDate();
				await closure(this.already_persisted);
			}
		}
	}

}