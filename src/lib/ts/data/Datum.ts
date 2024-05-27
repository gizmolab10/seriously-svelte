import RemoteIdentifiable from './RemoteIdentifiable';
import { idDefault } from './Identifiable';
import { DebugFlag } from '../debug/Debug';

export default class Datum extends RemoteIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string = idDefault, isRemotelyStored: boolean) {
		super(dbType, id, isRemotelyStored);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}

	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
