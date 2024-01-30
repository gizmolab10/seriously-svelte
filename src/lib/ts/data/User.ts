import Identifiable from '../common/Identifiable';
export default class User extends Identifiable {
	name: string;
	email: string;
	phone: string;

	constructor(id: string, name: string, email: string, phone: string) {
		super(id);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}