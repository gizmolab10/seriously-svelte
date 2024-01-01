import { removeAll } from './Utilities';
import { v4 as uuid } from 'uuid';

export default class Identifiable {
	id: string;

	constructor(id: string | null) {
		this.id = id ?? Identifiable.newID;
	}
	
	static get newID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	
}
