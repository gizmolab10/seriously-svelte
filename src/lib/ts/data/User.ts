import RemoteIdentifiable from "../structures/RemoteIdentifiable";

export default class User extends RemoteIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(id: string, name: string, email: string, phone: string, isRemotelyStored: boolean = false) {
		super(id, isRemotelyStored);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}