import type { Handle_Boolean } from '../../common/Types';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	plugin	 = 'plugin',
	local	 = 'local',
	test	 = 'test',
}

export default class Persistence_State {
	lastModifyDate = new Date();
	already_persisted = false;
	awaitingCreation = false;
	type_db: string;
	isDirty = false;

	constructor(type_db: string, already_persisted: boolean = false, awaitingCreation: boolean = false) {
		this.isDirty			= type_db != DBType.test && !already_persisted;
		this.already_persisted	= already_persisted;
		this.awaitingCreation	= awaitingCreation;
		this.type_db			= type_db;
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