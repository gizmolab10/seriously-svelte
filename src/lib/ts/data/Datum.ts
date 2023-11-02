import { Datum, removeAll } from '../common/GlobalImports';
import { v4 as uuid } from 'uuid';

export default class Basis {
	lastWriteDate: Date;
	isRemotelyStored: boolean;
	needsWrite = false;
	bulkName: string;
	id: string;

	static get newID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

	constructor(bulkName: string, id: string | null, isRemotelyStored: boolean) {
		this.isRemotelyStored = isRemotelyStored;
		this.lastWriteDate = new Date();
		this.id = id ?? Datum.newID;
		this.bulkName = bulkName;
	}

	updateWriteDate() { this.lastWriteDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
