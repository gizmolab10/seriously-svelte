import type { Integer } from '../common/Types';
import { u } from '../common/Utilities';
import { v4 as uuid } from 'uuid';
import '../common/Extensions';

export default class Identifiable {
	hid: Integer;
	id: string;

	constructor(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}

	static newID(prefix: string = 'NEW'): string { return prefix + u.removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
	equals(other: Identifiable | null | undefined): boolean { return !!other && this.hid == other.hid; }
	isHoverInverted(type: string): boolean { return false; }

	setID(id: string = Identifiable.newID()) {
		this.hid = id.hash();
		this.id = id;
	}
	
	static conntains_byHID<T>(from: Array<T>, item: T): boolean {
		const identifiable = item as Identifiable;
		const identifiables = from as Array<Identifiable>;
		return identifiables.filter(t => t.hid == identifiable.hid).length > 0;
	}

	static remove_byHID<T>(from: Array<T>, item: T): Array<T> {
		const identifiable = item as Identifiable;
		const identifiables = from as Array<Identifiable>;
		return identifiables.filter(t => t.hid != identifiable.hid) as Array<T>;
	}
	
}
