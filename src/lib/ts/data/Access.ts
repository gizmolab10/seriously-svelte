import RemoteIdentifiable from '../basis/RemoteIdentifiable';

export default class Access extends RemoteIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, hasBeen_remotely_saved: boolean = false) {
		super(dbType, id, hasBeen_remotely_saved);
		this.kind = kind;
	}
}