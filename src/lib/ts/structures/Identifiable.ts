import { u } from '../common/Utilities';
import { v4 as uuid } from 'uuid';
import '../common/Extensions';

export default class Identifiable {
	idHashed: number;
	id: string;

	constructor(id: string | null) {
		this.id = id ?? Identifiable.newID();
		this.idHashed = this.id.hash();
	}

	setID(id: string) {
		this.idHashed = id.hash();
		this.id = id;
	}
	
	static newID(prefix: string = 'NEW'): string { return prefix + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	
}
