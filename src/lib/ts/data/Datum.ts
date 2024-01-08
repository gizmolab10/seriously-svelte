import { dbDispatch, Hierarchy } from "../common/GlobalImports";
import Identifiable from "../common/Identifiable";
import { DebugFlag } from '../debug/Debug';

export class Datum extends Identifiable {
	awaitingCreation: boolean;
	isRemotelyStored: boolean;
	lastWriteDate: Date;
	needsWrite = false;
	baseID: string;

	constructor(baseID: string, id: string | null, isRemotelyStored: boolean) {
		super(id);
		this.isRemotelyStored = isRemotelyStored;
		this.lastWriteDate = new Date();
		this.awaitingCreation = false;
		this.baseID = baseID;
	}

	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy; }
	updateWriteDate() { this.lastWriteDate = new Date(); }
	log(option: DebugFlag, message: string) {}

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}

export default Datum;
