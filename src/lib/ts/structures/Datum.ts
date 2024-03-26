import RemoteIdentifiable from "./RemoteIdentifiable";
import { DebugFlag } from '../debug/Debug';

export default class Datum extends RemoteIdentifiable {
	baseID: string;

	constructor(baseID: string, id: string | null, isRemotelyStored: boolean) {
		super(id, isRemotelyStored);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}

	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
