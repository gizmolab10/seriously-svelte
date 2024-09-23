import RemoteIdentifiable from './RemoteIdentifiable';
import { DebugFlag } from '../common/Debug';

export default class Datum extends RemoteIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, hasBeen_remotely_saved: boolean = false) {
		super(dbType, id, hasBeen_remotely_saved);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}

	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
