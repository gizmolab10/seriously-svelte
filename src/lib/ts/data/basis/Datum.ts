import Persistent_Identifiable from './Persistent_Identifiable';
import { T_Debug } from '../../common/Debug';

export default class Datum extends Persistent_Identifiable {
	idBase: string;

	constructor(type_db: string, idBase: string, id: string, already_persisted: boolean = false) {
		super(type_db, id, already_persisted);
		this.idBase = idBase;
	}

	log(option: T_Debug, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.idBase != other.idBase; }

}
