import type { Async_Handle_Boolean } from '../../common/Types';
import { db_forType } from '../../managers/Databases';
import { T_Datum } from '../dbs/DBCommon';

export default class Persistence_State {
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	type_datum: T_Datum;
	t_database: string;
	isDirty = false;
	id: string;

	get isRemote(): boolean { return db_forType(this.t_database)?.isRemote ?? false; }
	updateModifyDate() { this.lastModifyDate = new Date(); }

	constructor(t_database: string, type_datum: T_Datum, id: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.id				   = id;
		this.t_database		   = t_database;			// needed for this.isRemote, below
		this.type_datum		   = type_datum;
		this.awaitingCreation  = awaitingCreation;
		this.already_persisted = already_persisted;
		this.isDirty		   = this.isRemote && !already_persisted;
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
		if (this.awaitingCreation) {
			console.log(`awaiting creation ${this.type_datum} ${this.id}`);
		} else {
			this.updateModifyDate();
			if (this.isRemote) {
				await closure(this.already_persisted);
			}
		}
	}

}