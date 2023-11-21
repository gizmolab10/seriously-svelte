import { removeAll } from '../common/Utilities';
import { DebugOption } from '../common/Debug';
import { v4 as uuid } from 'uuid';

export default class Datum {
	awaitingCreation: boolean;
	isRemotelyStored: boolean;
	lastWriteDate: Date;
	needsWrite = false;
	baseID: string;
	id: string;

	constructor(baseID: string, id: string | null, isRemotelyStored: boolean) {
		this.isRemotelyStored = isRemotelyStored;
		this.lastWriteDate = new Date();
		this.awaitingCreation = false;
		this.id = id ?? Datum.newID;
		this.baseID = baseID;
	}

	static get newID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	updateWriteDate() { this.lastWriteDate = new Date(); }
	log(option: DebugOption, message: string) {}

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
