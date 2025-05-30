import type { Dictionary } from '../common/Types';
import { T_Signal } from '../signals/Signals';

export class S_Busy {
	signals_inFlight_byT_Signal: Dictionary<boolean> = {};
	isPersisting = false;
	isFetching = false;

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
		closure();
		this.isPersisting = wasPersisting;
	}

	temporarily_set_isFetching_while(closure: () => void) {
		const wasFetching = this.isFetching;
		this.isFetching = true;
		closure();
		this.isFetching = wasFetching;
	}

}

export const busy = new S_Busy();
