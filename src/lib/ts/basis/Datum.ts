import PersistentIdentifiable from './PersistentIdentifiable';
import { DebugFlag } from '../common/Debug';

export default class Datum extends PersistentIdentifiable {
	baseID: string;

	constructor(dbType: string, baseID: string, id: string, already_persisted: boolean = false) {
		super(dbType, id, already_persisted);
		this.baseID = baseID;
	}

	log(option: DebugFlag, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.baseID != other.baseID; }

    static datum_fromJSON(json: string): Datum {
        const parsed = JSON.parse(json);
        return new Datum(parsed.dbType, parsed.baseID, parsed.id, true);
    }

}
