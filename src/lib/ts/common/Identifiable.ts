import { u } from './Utilities';
import { v4 as uuid } from 'uuid';

export default class Identifiable {
	id: string;
	hashedID: number;

	constructor(id: string | null) {
		this.id = id ?? Identifiable.newID;
		this.hashedID = this.id.hash();
	}

	setID(id: string) {
		this.id = id;
		this.hashedID = this.id.hash();
	}
	
	static get newID(): string { return 'NEW' + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	
}
