import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class Access extends PersistentIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, hasBeen_saved: boolean = false) {
		super(dbType, id, hasBeen_saved);
		this.kind = kind;
	}
}