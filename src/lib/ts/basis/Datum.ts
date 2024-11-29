import PersistentIdentifiable from './PersistentIdentifiable';
import { DebugFlag } from '../common/Debug';

export default class Datum extends PersistentIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, hasBeen_saved: boolean = false) {
		super(dbType, id, hasBeen_saved);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
