import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class User extends PersistentIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, already_persisted: boolean = false) {
		super(dbType, id, already_persisted);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}