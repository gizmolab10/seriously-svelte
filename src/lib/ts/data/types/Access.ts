import Persistent_Identifiable from '../basis/Persistent_Identifiable';

export default class Access extends Persistent_Identifiable {
	kind: string;

	constructor(t_database: string, id: string, kind: string, already_persisted: boolean = false) {
		super(t_database, id, already_persisted);
		this.kind = kind;
	}

}