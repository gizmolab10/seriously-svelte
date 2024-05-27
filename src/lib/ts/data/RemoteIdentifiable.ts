import { DBType } from '../db/DBInterface';
import { idDefault } from "../data/Identifiable";
import Identifiable from "../data/Identifiable";

export default class RemoteIdentifiable extends Identifiable {
	awaitingCreation: boolean;
	isRemotelyStored: boolean;
	hasRemoteStorage: boolean;
	lastWriteDate: Date;
	needsWrite = false;
	dbType: string;

	constructor(dbType: string, id: string  = idDefault, isRemotelyStored: boolean) {
		super(id);
		this.hasRemoteStorage = dbType != DBType.local;
		this.isRemotelyStored = isRemotelyStored;
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
