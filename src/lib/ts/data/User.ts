import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class User extends PersistentIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, hasBeen_saved: boolean = false) {
		super(dbType, id, hasBeen_saved);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}