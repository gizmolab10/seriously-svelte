import RemoteIdentifiable from './RemoteIdentifiable';

export default class User extends RemoteIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, isBackedUp_remotely: boolean = false) {
		super(dbType, id, isBackedUp_remotely);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}