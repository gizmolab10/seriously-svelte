import { u } from '../managers/Utilities';
import { v4 as uuid } from 'uuid';
import '../common/Extensions';

export default class Identifiable {
	idHashed: number;
	id: string;

	constructor(id: string = idDefault) {
		this.idHashed = id.hash();
		this.id = id;
	}

	setID(id: string = idDefault) {
		this.idHashed = id.hash();
		this.id = id;
	}
	
	static newID(prefix: string = 'NEW'): string { return prefix + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	
}

export const idDefault = Identifiable.newID();
