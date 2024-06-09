import RemoteIdentifiable from './RemoteIdentifiable';

export default class Access extends RemoteIdentifiable {
	kind: string;

	constructor(dbType: string, id: string, kind: string, isRemotelyStored: boolean = false) {
		super(dbType, id, isRemotelyStored);
		this.kind = kind;
	}
}