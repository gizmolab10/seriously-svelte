import { u } from './Utilities';
import { v4 as uuid } from 'uuid';

export default class Identifiable {
	hashedID: number;
	id: string;

	constructor(id: string | null) {
		this.id = id ?? Identifiable.newID;
		this.hashedID = this.id.hash();
	}

	setID(id: string) {
		this.hashedID = id.hash();
		this.id = id;
	}
	
	static get newID(): string { return 'NEW' + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	
}
