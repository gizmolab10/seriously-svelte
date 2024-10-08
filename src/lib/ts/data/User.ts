import RemoteIdentifiable from '../basis/RemoteIdentifiable';

export default class User extends RemoteIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, hasBeen_remotely_saved: boolean = false) {
		super(dbType, id, hasBeen_remotely_saved);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}