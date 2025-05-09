import Persistable from '../persistable/Persistable';
import { E_Persistable } from '../database/DBCommon';

export default class User extends Persistable {
	email: string;
	phone: string;
	name: string;

	constructor(e_database: string, e_persistable: E_Persistable, id: string, name: string, email: string, phone: string, already_persisted: boolean = false) {
		super(e_database, '', e_persistable, id, already_persisted);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}