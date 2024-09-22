import Identifiable from '../data/Identifiable';
import { DBType } from '../db/DBInterface';

export default class RemoteIdentifiable extends Identifiable {
	awaitingCreation: boolean;
	isBackedUp_remotely: boolean;
	hasRemoteStorage: boolean;
	lastWriteDate: Date;
	needsWrite = false;
	dbType: string;

	constructor(dbType: string, id: string, isBackedUp_remotely: boolean = false) {
		super(id);
		this.hasRemoteStorage = dbType != DBType.local;
		this.isBackedUp_remotely = isBackedUp_remotely;
		this.lastWriteDate = new Date();
		this.awaitingCreation = false;
		this.dbType = dbType;
	}

	updateWriteDate() { this.lastWriteDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
