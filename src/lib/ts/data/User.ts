import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class User extends PersistentIdentifiable {
	name: string;
	email: string;
	phone: string;

	constructor(dbType: string, id: string, name: string, email: string, phone: string, already_saved: boolean = false) {
		super(dbType, id, already_saved);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

    static user_fromJSON(json: string): User {
        const parsed = JSON.parse(json);
        return new User(parsed.dbType, parsed.id, parsed.name, parsed.email, parsed.phone, true);
    }

}