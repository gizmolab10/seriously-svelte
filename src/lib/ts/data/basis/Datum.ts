import Persistent_Identifiable from './Persistent_Identifiable';
import { T_Debug } from '../../common/Debug';
import { T_Datum } from '../dbs/DBCommon';

export default class Datum extends Persistent_Identifiable {
	type_datum: T_Datum;
	idBase: string;

	constructor(type_db: string, idBase: string, type_datum: T_Datum, id: string, already_persisted: boolean = false) {
		super(type_db, type_datum, id, already_persisted);
		this.type_datum = type_datum;
		this.idBase = idBase;
	}

	log(option: T_Debug, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.idBase != other.idBase; }

}
