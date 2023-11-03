import { removeAll } from '../common/Utilities';
import { v4 as uuid } from 'uuid';

export default class Datum {
	awaitingCreation: boolean;
	isRemotelyStored: boolean;
	lastWriteDate: Date;
	needsWrite = false;
	bulkName: string;
	id: string;

	constructor(bulkName: string, id: string | null, isRemotelyStored: boolean) {
		this.isRemotelyStored = isRemotelyStored;
		this.lastWriteDate = new Date();
		this.awaitingCreation = false;
		this.id = id ?? Datum.newID;
		this.bulkName = bulkName;
	}

	static get newID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	updateWriteDate() { this.lastWriteDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
