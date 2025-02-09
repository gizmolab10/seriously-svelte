import { w_ancestry_focus, w_rebuild_isInProgress } from '../state/S_Stores';
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

	static readonly SENDING: unique symbol;

	signal_isInFlight = false;
	conduit = new Signal<(t_signal: T_Signal, priority: number, value: any) => void>();

	signal_altering(value: any = null) { this.signal(T_Signal.alterState, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph_from(get(w_ancestry_focus)); }
	signal_relayoutWidgets_from(value: any = null) { this.signal(T_Signal.relayout, value); }
	signal_relayoutWidgets_fromFocus() { this.signal_relayoutWidgets_from(get(w_ancestry_focus)); }

	signal_rebuildGraph_from(value: any = null) {
		w_rebuild_isInProgress.set(true);
		this.signal(T_Signal.rebuild, value);
		w_rebuild_isInProgress.set(false);				// N.B., widget whatches this to reveal tools
	}

	signal(t_signal: T_Signal, value: any = null) {
		if (this.signal_isInFlight) {					// avoid sending multiple simultaneous signals
			debug.log_signals(`NOT SENDING ${t_signal} in flight`);
		} else if (!get(w_rebuild_isInProgress) ||		// also, if rebuild is in progress
			t_signal != T_Signal.relayout) {			// suppress relayout
			this.signal_isInFlight = true;
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				// debug.log_signals(`SENDING ${t_signal}`);
				this.conduit.emit(t_signal, priority, value);
			}
			this.signal_isInFlight = false;
		}
	}

	static readonly RECEIVING: unique symbol;

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_t_signal_atPriority(T_Signal.rebuild, priority, onSignal);
	}

	handle_relayoutWidgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_t_signal_atPriority(T_Signal.relayout, priority, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_t_signal_atPriority(T_Signal.alterState, 0, onSignal);
	}

	handle_anySignal_atPriority(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forAllSignals(priority);
		return this.conduit.connect((ignored_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				debug.log_signals(`HANDLING ${ignored_t_signal} at ${priority}`);
				onSignal(ignored_t_signal, value);
			}
		});
	}

	handle_t_signal_atPriority(t_signal: T_Signal, priority: number, onSignal: (value: any | null) => any ) {
		this.adjust_highestPriority_forSignal(priority, t_signal);
		return this.conduit.connect((t_signals, signalPriority, value) => {
			if (t_signals.includes(t_signal) && signalPriority == priority) {
				debug.log_signals(`HANDLING ${t_signal} at ${priority}`);
				onSignal(value);
			}
		});
	}

	static readonly PRIORITY: unique symbol;

	// for each signal type, this array contains the highest requested priority
	// for each signal sent, a signal is emitted for each priority separately, in increasing priority from 0 to highest
	// each handler has a type and a priority, and ignores all emitted signals except the one matching its priority
	
	highestPriorities: { [id_signal: string]: number } = {}

	adjust_highestPriority_forAllSignals(priority: number) {
		const all_t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.relayout, T_Signal.alterState];
		for (const t_signal of all_t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

	adjust_highestPriority_forSignal(priority: number, t_signal: T_Signal) {
		const highestPriority = this.highestPriorities[t_signal];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[t_signal] = priority;
		}
	}

}

export const signals = new Signals();
