import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class Access extends PersistentIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, already_saved: boolean = false) {
		super(dbType, id, already_saved);
		this.kind = kind;
	}

    static access_fromJSON(json: string): Access {
        const parsed = JSON.parse(json);
        return new Access(parsed.dbType, parsed.id, parsed.kind, true);
    }
}