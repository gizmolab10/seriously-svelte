import RemoteIdentifiable from './RemoteIdentifiable';
import { DebugFlag } from '../debug/Debug';

export default class Datum extends RemoteIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, isRemotelyStored: boolean) {
		super(dbType, id, isRemotelyStored);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}

	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
