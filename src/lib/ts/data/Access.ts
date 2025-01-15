import Persistent_Identifiable from '../basis/Persistent_Identifiable';

export default class Access extends Persistent_Identifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, already_persisted: boolean = false) {
		super(dbType, id, already_persisted);
		this.kind = kind;
	}

}