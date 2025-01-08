import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class Access extends PersistentIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, already_persisted: boolean = false) {
		super(dbType, id, already_persisted);
		this.kind = kind;
	}

}