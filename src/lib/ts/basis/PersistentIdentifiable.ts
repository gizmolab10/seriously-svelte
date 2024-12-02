import Identifiable from './Identifiable';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	file	 = 'file',
	test	 = 'test',
}

export enum DatumType {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	hierarchy	  = 'Hierarchy',	// includes parent contains and relateds
	progeny		  = 'Progeny',		// only child contains
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
}

export default class PersistentIdentifiable extends Identifiable {
	needs_persisting_again = false;
	hasPersistentStorage: boolean;
	awaitingCreation: boolean;
	already_persisted: boolean;
	lastModifyDate: Date;
	dbType: string;

	constructor(dbType: string, id: string, already_persisted: boolean = false) {
		super(id);
		this.hasPersistentStorage = dbType != DBType.test;
		this.needs_persisting_again = this.hasPersistentStorage && !already_persisted;
		this.already_persisted = already_persisted;
		this.lastModifyDate = new Date();
		this.awaitingCreation = false;
		this.dbType = dbType;
	}

	updateModifyDate() { this.lastModifyDate = new Date(); }
	async persist() {}

    static persistent_fromJSON(json: string): PersistentIdentifiable {
        const parsed = JSON.parse(json);
        return new PersistentIdentifiable(parsed.dbType, parsed.id, true);
    }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.log('slow: needs remote save')
		}
		return result;
	}

}
