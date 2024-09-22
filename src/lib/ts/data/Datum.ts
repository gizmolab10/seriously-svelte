import RemoteIdentifiable from './RemoteIdentifiable';
import { DebugFlag } from '../common/Debug';

export default class Datum extends RemoteIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, isBackedUp_remotely: boolean = false) {
		super(dbType, id, isBackedUp_remotely);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}

	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
