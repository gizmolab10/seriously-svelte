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
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
}

export default class PersistentIdentifiable extends Identifiable {
	hasPersistentStorage: boolean;
	awaitingCreation: boolean;
	already_saved: boolean;
	lastModifyDate: Date;
	needsWrite = false;
	dbType: string;

	constructor(dbType: string, id: string, already_saved: boolean = false) {
		super(id);
		this.hasPersistentStorage = dbType != DBType.test;
		this.already_saved = already_saved;
		this.lastModifyDate = new Date();
		this.awaitingCreation = false;
		this.dbType = dbType;
	}

	updateModifyDate() { this.lastModifyDate = new Date(); }
	persist() {}

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
