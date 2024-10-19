import Identifiable from '../basis/Identifiable';
import { DBType } from '../db/DBInterface';

export default class RemoteIdentifiable extends Identifiable {
	hasBeen_remotely_saved: boolean;
	hasRemoteStorage: boolean;
	awaitingCreation: boolean;
	lastModifyDate: Date;
	needsWrite = false;
	dbType: string;

	constructor(dbType: string, id: string, hasBeen_remotely_saved: boolean = false) {
		super(id);
		this.hasBeen_remotely_saved = hasBeen_remotely_saved;
		this.hasRemoteStorage = dbType != DBType.local;
		this.lastModifyDate = new Date();
		this.awaitingCreation = false;
		this.dbType = dbType;
	}

	async remoteWrite() {}
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
