import { T_Debug } from '../../common/Debug';
import { T_Datum } from '../dbs/DBCommon';
import Persistable from './Persistable';

export default class Datum extends Persistable {
	type_datum: T_Datum;
	idBase: string;

	constructor(t_database: string, idBase: string, type_datum: T_Datum, id: string, already_persisted: boolean = false) {
		super(t_database, type_datum, id, already_persisted);
		this.type_datum = type_datum;
		this.idBase = idBase;
	}

	log(option: T_Debug, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.idBase != other.idBase; }

}
