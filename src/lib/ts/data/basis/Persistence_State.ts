import type { Handle_Boolean } from '../../common/Types';
import { db_forType } from '../../managers/Databases';

export default class Persistence_State {
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	type_db: string;
	isDirty = false;

	get isRemote(): boolean { return db_forType(this.type_db)?.isRemote ?? false; }
	updateModifyDate() { this.lastModifyDate = new Date(); }

	constructor(type_db: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.type_db			= type_db;
		this.awaitingCreation	= awaitingCreation;
		this.already_persisted	= already_persisted;
		this.isDirty			= this.isRemote && !already_persisted;
	}

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.log('slow: needs remote save')
		}
		return result;
	}

	async persist_withClosure(closure: Handle_Boolean) {
		if (!this.awaitingCreation) {
			this.updateModifyDate();
			if (this.isRemote) {
				closure(this.already_persisted);
			}
		}
	}

}