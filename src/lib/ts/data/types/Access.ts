import Persistable from '../basis/Persistable';
import { T_Datum } from '../dbs/DBCommon';

export default class Access extends Persistable {
	kind: string;

	constructor(t_database: string, type_datum: T_Datum, id: string, kind: string, already_persisted: boolean = false) {
		super(t_database, type_datum, id, already_persisted);
		this.kind = kind;
	}

}