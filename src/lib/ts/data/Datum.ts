import { removeAll } from '../common/GlobalImports';
import { v4 as uuid } from 'uuid';

export default class Basis {
	lastWriteDate = new Date();
	isRemotelyStored: boolean;
	needsWrite = false;
	bulkName: string;
	id: string;

	static get newID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

	constructor(bulkName: string, id: string, isRemotelyStored: boolean) {
		this.isRemotelyStored = isRemotelyStored;
		this.bulkName = bulkName;
		this.id = id;
	}

	updateWriteDate() { this.lastWriteDate = new Date(); }
	wasModifiedWithinMS(threshold: number): boolean {
		const now = new Date();
		const duration = now.getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
