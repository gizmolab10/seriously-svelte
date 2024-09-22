import RemoteIdentifiable from './RemoteIdentifiable';

export default class Access extends RemoteIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, isBackedUp_remotely: boolean = false) {
		super(dbType, id, isBackedUp_remotely);
		this.kind = kind;
	}
}