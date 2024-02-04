import Identifiable from "./Identifiable";

export default class RemoteIdentifiable extends Identifiable {
	awaitingCreation: boolean;
	isRemotelyStored: boolean;
	lastWriteDate: Date;
	needsWrite = false;

	constructor(id: string | null, isRemotelyStored: boolean) {
		super(id);
		this.isRemotelyStored = isRemotelyStored;
		this.lastWriteDate = new Date();
		this.awaitingCreation = false;
	}

	updateWriteDate() { this.lastWriteDate = new Date(); }

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastWriteDate.getTime();
		return duration < threshold;
	}

}
