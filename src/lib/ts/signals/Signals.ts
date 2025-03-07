import { stores, w_ancestry_focus } from '../common/Stores';
import { debug } from '../debug/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum T_Signal {
	thing	   = 'thing',
	rebuild	   = 'rebuild',
	recreate   = 'recreate',
	relayout   = 'relayout',
	alterState = 'alterState',
}

export class Signals {

	static readonly SENDING: unique symbol;

	signal_isInFlight = false;
	rebuild_isInProgress = false;
	conduit = new Signal<(t_signal: T_Signal, priority: number, value: any) => void>();

	signal_altering(value: any = null) { this.signal(T_Signal.alterState, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph_from(get(w_ancestry_focus)); }
	signal_recreate_widgets_from(value: any = null) { this.signal(T_Signal.recreate, value); }
	signal_relayout_widgets_from(value: any = null) { this.signal(T_Signal.relayout, value); }
	signal_recreate_widgets_fromFocus() { this.signal_recreate_widgets_from(get(w_ancestry_focus)); }
	signal_relayout_widgets_fromFocus() { this.signal_relayout_widgets_from(get(w_ancestry_focus)); }

	signal_rebuildGraph_from(value: any = null) {
		this.rebuild_isInProgress = true;
		this.signal(T_Signal.rebuild, value);
		this.rebuild_isInProgress = false;				// N.B., widget whatches this to reveal tools
	}

	signal(t_signal: T_Signal, value: any = null) {
		if (this.signal_isInFlight) {					// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SENDING ${t_signal} in flight`);
		} else if (!this.rebuild_isInProgress ||		// also, if rebuild is in progress
			t_signal != T_Signal.relayout) {			// suppress relayout
			this.signal_isInFlight = true;
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				// debug.log_signal(`SENDING ${t_signal}`);
				this.conduit.emit(t_signal, priority, value);
			}
			this.signal_isInFlight = false;
		}
	}

	static readonly RECEIVING: unique symbol;

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.rebuild, priority, onSignal);
	}

	handle_recreate_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.recreate, priority, onSignal);
	}

	handle_relayout_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.relayout, priority, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.alterState, 0, onSignal);
	}

	handle_signal_atPriority(t_signal: T_Signal, priority: number, onSignal: (value: any | null) => any ) {
		this.adjust_highestPriority_forSignal(priority, t_signal);
		return this.conduit.connect((received_t_signal, signalPriority, value) => {
			if (received_t_signal == t_signal && signalPriority == priority) {
				// debug.log_handle(`(ONLY) ${t_signal} at ${priority}`);
				onSignal(value);
			}
		});
	}

	handle_anySignal_atPriority(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forAllSignals(priority);
		return this.conduit.connect((received_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				// debug.log_handle(`(ANY as: ${received_t_signal}) at ${priority}`);
				onSignal(received_t_signal, value);
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
