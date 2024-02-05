import RemoteIdentifiable from "../structures/RemoteIdentifiable";

export default class Access extends RemoteIdentifiable {
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = false) {
		super(id, isRemotelyStored);
		this.kind = kind;
	}
}