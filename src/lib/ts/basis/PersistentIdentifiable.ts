import Identifiable from './Identifiable';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	local	 = 'local',
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
	hasPersistentStorage: boolean;
	lastModifyDate = new Date();
	already_persisted: boolean;
	awaitingCreation = false;
	isDirty = false;
	dbType: string;

	constructor(dbType: string, id: string, already_persisted: boolean = false) {
		super(id);
		this.dbType = dbType;
		this.already_persisted = already_persisted;
		this.hasPersistentStorage = dbType != DBType.test;
		this.isDirty = this.hasPersistentStorage && !already_persisted;
	}

	async persist() {}
	set_isDirty() { this.isDirty = true; }		// TODO: set global
	updateModifyDate() { this.lastModifyDate = new Date(); }

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
