import Persistent_Identifiable from '../basis/Persistent_Identifiable';

export default class Access extends Persistent_Identifiable {
	kind: string;

	constructor(type_db: string, id: string, kind: string, already_persisted: boolean = false) {
		super(type_db, id, already_persisted);
		this.kind = kind;
	}

}