import type { Integer } from '../../common/Types';
import { u } from '../../managers/Utilities';
import { v4 as uuid } from 'uuid';
import '../../common/Extensions';

export default class Identifiable {
	hid: Integer;
	id: string;

	constructor(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}

	static newID(prefix: string = 'NEW'): string { return prefix + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	isHoverInverted(type: string): boolean { return false; }

	setID(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}
	
}
