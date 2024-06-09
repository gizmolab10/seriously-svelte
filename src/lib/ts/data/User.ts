import RemoteIdentifiable from './RemoteIdentifiable';

export default class User extends RemoteIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, isRemotelyStored: boolean = false) {
		super(dbType, id, isRemotelyStored);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}