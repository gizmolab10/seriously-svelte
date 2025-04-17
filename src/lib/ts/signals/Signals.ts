import { w_ancestry_focus } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { debug } from '../debug/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum T_Signal {
	thing	   = 'thing',
	rebuild	   = 'rebuild',
	reattach   = 'reattach',
	reposition = 'reposition',
	alterState = 'alterState',
}

export class Signals {
	signals_inFlight: Dictionary<boolean> = {}

	static readonly SENDING: unique symbol;

	conduit = new Signal<(t_signal: T_Signal, priority: number, value: any) => void>();
	
	signal_altering(value: any = null) { this.signal(T_Signal.alterState, value); }
	signal_rebuildGraph_from(value: any = null) { this.signal(T_Signal.rebuild, value); }	// N.B., widget whatches this to reveal tools
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph_from(get(w_ancestry_focus)); }
	signal_reattach_widgets_from(value: any = null) { this.signal(T_Signal.reattach, value); }
	signal_setTo(t_signal: T_Signal, flag: boolean) { this.signals_inFlight[t_signal] = flag; }
	signal_reposition_widgets_from(value: any = null) { this.signal(T_Signal.reposition, value); }
	signal_reattach_widgets_fromFocus() { this.signal_reattach_widgets_from(get(w_ancestry_focus)); }
	signal_reposition_widgets_fromFocus() { this.signal_reposition_widgets_from(get(w_ancestry_focus)); }
	get signal_isInFlight(): boolean { return Object.values(this.signals_inFlight).filter(b => !!b).length > 0 }


	signal(t_signal: T_Signal, value: any = null) {
		if (this.signal_isInFlight) {							// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SENDING ${t_signal} in flight`);
		} else if (!this.signals_inFlight[T_Signal.rebuild] ||	// also, if rebuild is in progress
			t_signal != T_Signal.reposition) {					// suppress reposition
			this.signal_setTo(t_signal, true);
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				// debug.log_signal(`SENDING ${t_signal}`);
				this.conduit.emit(t_signal, priority, value);
			}
			this.signal_setTo(t_signal, false);
		}
	}

	static readonly RECEIVING: unique symbol;

	handle_rebuild_andReattach(priority: number, onSignal: (value: any | null) => any) {
		return this.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], priority, onSignal);
	}

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.rebuild, priority, onSignal);
	}

	handle_reattach_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.reattach, priority, onSignal);
	}

	handle_reposition_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.reposition, priority, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.alterState, 0, onSignal);
	}

	handle_signal_atPriority(t_signal: T_Signal, priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([t_signal], priority, onSignal);
	}

	handle_signals_atPriority(t_signals: Array<T_Signal>, priority: number, onSignal: (value: any | null) => any ) {
		this.adjust_highestPriority_forSignals(priority, t_signals);
		return this.conduit.connect((received_t_signal, signalPriority, value) => {
			for (const t_signal of t_signals) {
				if (received_t_signal == t_signal && signalPriority == priority) {
					// debug.log_handle(`(ONLY) ${t_signal} at ${priority}`);
					onSignal(value);
				}
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

	adjust_highestPriority_forSignals(priority: number, t_signals: Array<T_Signal>) {
		for (const t_signal of t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

	adjust_highestPriority_forSignal(priority: number, t_signal: T_Signal) {
		const highestPriority = this.highestPriorities[t_signal];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[t_signal] = priority;
		}
	}

	adjust_highestPriority_forAllSignals(priority: number) {
		const all_t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.reposition, T_Signal.alterState];
		for (const t_signal of all_t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

}

export const signals = new Signals();
