import { w_data_updated } from '../managers/Stores';

export class S_Busy {
	isPersisting = false;
	isFetching = false;

	get isDatabaseBusy(): boolean { return this.isPersisting || this.isFetching; }

	async temporarily_set_isPersisting_while(closure: () => Promise<void>) {
		const wasPersisting = this.isPersisting;
		this.isPersisting = true;
		this.signal_data_redraw();
		await closure();
		this.isPersisting = wasPersisting;
		this.signal_data_redraw();
	}

	async temporarily_set_isFetching_while(closure: () => Promise<void>) {
		const wasFetching = this.isFetching;
		this.isFetching = true;
		this.signal_data_redraw();
		await closure();
		this.isFetching = wasFetching;
		this.signal_data_redraw();
	}

	signal_data_redraw(after: number = 0) {
		setTimeout(() => {
			w_data_updated.set(new Date().getTime());
		}, after);
	}

}

export const busy = new S_Busy();
