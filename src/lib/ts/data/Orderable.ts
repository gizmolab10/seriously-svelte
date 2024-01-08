import { Datum } from "../common/GlobalImports";

export class Orderable extends Datum {
	order: number;

	constructor(baseID: string, order: number, id: string | null, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.order = order;
	}

	async order_setTo(newOrder: number, remoteWrite: boolean) {}

}

export default Orderable;
