import Persistent_Identifiable from './Persistent_Identifiable';
import { DebugFlag } from '../../common/Debug';

export default class Datum extends Persistent_Identifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, already_persisted: boolean = false) {
		super(dbType, id, already_persisted);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

}
