import { s_focus_ancestry, s_rebuild_isInProgress } from '../state/S_Stores';
import { debug } from '../common/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum T_Signal {
	thing	   = 'thing',
	rebuild	   = 'rebuild',
	relayout   = 'relayout',
	alterState = 'alterState',
}

export class Signals {
	signal_isInFlight = false;
	highestPriorities: { [id_signal: string]: number } = {}
	handler = new Signal<(ids_signal: Array<T_Signal>, value: any, priority: number) => void>();

	signal_altering(value: any = null) { this.signal(T_Signal.alterState, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph(get(s_focus_ancestry)); }
	signal_relayoutWidgets(value: any = null) { this.signal(T_Signal.relayout, value); }
	signal_relayoutWidgets_fromFocus() { this.signal_relayoutWidgets(get(s_focus_ancestry)); }

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, T_Signal.rebuild, onSignal);
	}

	handle_relayoutWidgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, T_Signal.relayout, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(0, T_Signal.alterState, onSignal);
	}

	handle_anySignal(onSignal: (ids_signal: Array<T_Signal>, value: any | null) => any ) {
		return this.handler.connect((ids_signal, value) => {
			onSignal(ids_signal, value);
		});
	}

	handle_signalOfKind(priority: number, id_signal: T_Signal, onSignal: (value: any | null) => any ) {
		const highestPriority = this.highestPriorities[id_signal];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[id_signal] = priority;
		}
		return this.handler.connect((ids_signal, value, signalPriority) => {
			if (ids_signal.includes(id_signal) && signalPriority == priority) {
				onSignal(value);
			}
		});
	}

	signal(id_signal: T_Signal, value: any = null) {
		if (this.signal_isInFlight) {
			debug.log_signal(`${id_signal} in flight`);
		} else if (!get(s_rebuild_isInProgress) ||		// if rebuild is in progress
			id_signal != T_Signal.relayout) {			// disable relayout
			this.signal_isInFlight = true;
			const highestPriority = this.highestPriorities[id_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				debug.log_signal(`${id_signal}`);
				this.handler.emit([id_signal], value, priority);
			}
			this.signal_isInFlight = false;
		}
	}

	signal_rebuildGraph(value: any = null) {
		s_rebuild_isInProgress.set(true);
		this.signal(T_Signal.rebuild, value);
		s_rebuild_isInProgress.set(false);				// N.B., widget whatches this to reveal tools
	}

}

export const signals = new Signals();
