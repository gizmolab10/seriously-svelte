import { w_storage_updated } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { T_Signal } from '../signals/Signals';

export class S_Busy {
	signals_inFlight_byT_Signal: Dictionary<boolean> = {};
	isPersisting = false;
	isFetching = false;

	get isDatabaseBusy(): boolean { return this.isPersisting || this.isFetching; }

	get anySignal_isInFlight(): boolean {
		return Object.values(this.signals_inFlight_byT_Signal).some(flag => !!flag);
	}

	set_signal_isInFlight_for(t_signal: T_Signal, flag: boolean) {
		this.signals_inFlight_byT_Signal[t_signal] = flag;
	}

	signal_isInFlight_for(t_signal: T_Signal): boolean {
		return this.signals_inFlight_byT_Signal[t_signal];
	}

	temporarily_set_isPersisting_while(closure: () => void) {
		const wasPersisting = this.isPersisting;
		this.isPersisting = true;
		// this.signal_storage_redraw();
		closure();
		this.isPersisting = wasPersisting;
	}

	async temporarily_set_isFetching_while(closure: () => Promise<void>) {
		const wasFetching = this.isFetching;
		this.isFetching = true;
		console.log('temporarily_set_isFetching begun');
		// this.signal_storage_redraw();
		await closure();
		console.log('temporarily_set_isFetching done');
		this.isFetching = wasFetching;
	}

	signal_storage_redraw(after: number = 1) {
		setTimeout(() => {
			// console.log('signal_storage_redraw', after);
			w_storage_updated.set(new Date().getTime());
		}, after);
	}

}

export const busy = new S_Busy();
