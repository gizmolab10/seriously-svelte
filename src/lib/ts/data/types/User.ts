import Persistable from '../basis/Persistable';
import { T_Datum } from '../dbs/DBCommon';

export default class User extends Persistable {
	email: string;
	phone: string;
	name: string;

	constructor(t_database: string, type_datum: T_Datum, id: string, name: string, email: string, phone: string, already_persisted: boolean = false) {
		super(t_database, type_datum, id, already_persisted);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}