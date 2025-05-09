import Persistable from '../persistable/Persistable';
import { E_Persistable } from '../database/DBCommon';

export default class Access extends Persistable {
	kind: string;

	constructor(e_database: string, e_persistable: E_Persistable, id: string, kind: string, already_persisted: boolean = false) {
		super(e_database, '', e_persistable, id, already_persisted);
		this.kind = kind;
	}

}