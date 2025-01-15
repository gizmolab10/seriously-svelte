import type { Handle_Boolean } from '../common/Types';

export default class Persistence_State {
	hasPersistentStorage = false;
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	isDirty = false;

	constructor(hasPersistentStorage: boolean = false, already_persisted: boolean = false, awaitingCreation: boolean = false, isDirty: boolean = false) {
		this.hasPersistentStorage = hasPersistentStorage;
		this.already_persisted	  = already_persisted;
		this.awaitingCreation	  = awaitingCreation;
		this.isDirty			  = isDirty;
	}

	updateModifyDate() { this.lastModifyDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.log('slow: needs remote save')
		}
		return result;
	}

	async persist_withClosure(closure: Handle_Boolean) {
		if (this.isDirty || !this.awaitingCreation) {
			this.updateModifyDate();
			closure(this.already_persisted);
		}
	}

}