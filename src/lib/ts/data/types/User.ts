import Persistent_Identifiable from '../basis/Persistent_Identifiable';

export default class User extends Persistent_Identifiable {
	name: string;
	email: string;
	phone: string;

	constructor(t_database: string, id: string, name: string, email: string, phone: string, already_persisted: boolean = false) {
		super(t_database, id, already_persisted);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}