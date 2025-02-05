import { T_Debug } from '../../common/Debug';
import { T_Persistable } from '../dbs/DBCommon';
import Persistable from './Persistable';

export default class Datum extends Persistable {
	t_persistable: T_Persistable;
	idBase: string;

	constructor(t_database: string, idBase: string, t_persistable: T_Persistable, id: string, already_persisted: boolean = false) {
		super(t_database, t_persistable, id, already_persisted);
		this.t_persistable = t_persistable;
		this.idBase = idBase;
	}

	log(option: T_Debug, message: string) {}
	isInDifferentBulkThan(other: Datum) { return this.idBase != other.idBase; }

}
