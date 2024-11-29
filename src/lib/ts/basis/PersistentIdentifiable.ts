import Identifiable from './Identifiable';
import { DBType } from '../db/DBInterface';

export default class PersistentIdentifiable extends Identifiable {
	hasPersistentStorage: boolean;
	awaitingCreation: boolean;
	hasBeen_saved: boolean;
	lastModifyDate: Date;
	needsWrite = false;
	dbType: string;

	constructor(dbType: string, id: string, hasBeen_saved: boolean = false) {
		super(id);
		this.hasPersistentStorage = dbType != DBType.test;
		this.hasBeen_saved = hasBeen_saved;
		this.lastModifyDate = new Date();
		this.awaitingCreation = false;
		this.dbType = dbType;
	}

	async persist() {}
	updateModifyDate() { this.lastModifyDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.log('slow: needs remote save')
		}
		return result;
	}

}
