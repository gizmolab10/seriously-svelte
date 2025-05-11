import { w_ancestry_focus } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { debug } from '../debug/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum E_Signal {
	thing		= 'thing',
	rebuild		= 'rebuild',
	reattach	= 'reattach',
	reposition	= 'reposition',
	alteration	= 'alteration',
	tool_update	= 'tool_update',
}

export enum E_Signal_From {
	keyboard = 'keyboard',
	mouse = 'mouse',
	tool = 'tool',
}

// E_Signal
// priority
// value

	// for each of the E_Signal values, this array contains the highest requested priority
	// for each signal sent, a signal is emitted for each priority separately, in increasing priority from 0 to highest
	// each handler has a type and a priority, and ignores all emitted signals except the one matching its priority

// move to store
//  w_s_signal (soon to be this class)		// this will not support multiple simultaneous signals
//  w_signals_inFlight

export class Signals {
	signals_inFlight: Dictionary<boolean> = {}

	static readonly SENDING: unique symbol;

	conduit = new Signal<(e_signal: E_Signal, priority: number, value: any) => void>();
	
	signal_blink_forAlteration(value: any = null) { this.signal(E_Signal.alteration, value); }
	signal_tool_update(value: any = null) { this.signal(E_Signal.tool_update, value); }
	signal_rebuildGraph_from(value: any = null) { this.signal(E_Signal.rebuild, value); }	// N.B., widget whatches this to reveal tools
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph_from(get(w_ancestry_focus)); }
	signal_reattach_widgets_from(value: any = null) { this.signal(E_Signal.reattach, value); }
	signal_setTo(e_signal: E_Signal, flag: boolean) { this.signals_inFlight[e_signal] = flag; }
	signal_reposition_widgets_from(value: any = null) { this.signal(E_Signal.reposition, value); }
	signal_reattach_widgets_fromFocus() { this.signal_reattach_widgets_from(get(w_ancestry_focus)); }
	signal_reposition_widgets_fromFocus() { this.signal_reposition_widgets_from(get(w_ancestry_focus)); }
	get signal_isInFlight(): boolean { return Object.values(this.signals_inFlight).filter(b => !!b).length > 0 }


	signal(e_signal: E_Signal, value: any = null) {
		if (this.signal_isInFlight) {							// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SENDING ${e_signal} in flight`);
		} else if (!this.signals_inFlight[E_Signal.rebuild] ||	// also, if rebuild is in progress
			e_signal != E_Signal.reposition) {					// suppress reposition
			this.signal_setTo(e_signal, true);
			const highestPriority = this.highestPriorities[e_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				// debug.log_signal(`SENDING ${e_signal}`);
				this.conduit.emit(e_signal, priority, value);
			}
			this.signal_setTo(e_signal, false);
		}
	}

	static readonly RECEIVING: unique symbol;

	handle_rebuild_andReattach(priority: number, onSignal: (value: any | null) => any) {
		return this.handle_signals_atPriority([E_Signal.rebuild, E_Signal.reattach], priority, onSignal);
	}

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(E_Signal.rebuild, priority, onSignal);
	}

	handle_reattach_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(E_Signal.reattach, priority, onSignal);
	}

	handle_reposition_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(E_Signal.reposition, priority, onSignal);
	}

	handle_tool_update(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(E_Signal.tool_update, priority, onSignal);
	}

	handle_blink_forAlteration(onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(E_Signal.alteration, 0, onSignal);
	}

	handle_signal_atPriority(e_signal: E_Signal, priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([e_signal], priority, onSignal);
	}

	handle_signals_atPriority(e_signals: Array<E_Signal>, priority: number, onSignal: (value: any | null) => any ) {
		this.adjust_highestPriority_forSignals(priority, e_signals);
		return this.conduit.connect((received_t_signal, signalPriority, value) => {
			for (const e_signal of e_signals) {
				if (received_t_signal == e_signal && signalPriority == priority) {
					// debug.log_handle(`(ONLY) ${e_signal} at ${priority}`);
					onSignal(value);
				}
			}
		});
	}

	handle_anySignal_atPriority(priority: number, onSignal: (e_signal: E_Signal, value: any | null) => any ) {
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

	adjust_highestPriority_forSignals(priority: number, e_signals: Array<E_Signal>) {
		for (const e_signal of e_signals) {
			this.adjust_highestPriority_forSignal(priority, e_signal);
		}
	}

	adjust_highestPriority_forSignal(priority: number, e_signal: E_Signal) {
		const highestPriority = this.highestPriorities[e_signal];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[e_signal] = priority;
		}
	}

	adjust_highestPriority_forAllSignals(priority: number) {
		const all_t_signals = [E_Signal.thing, E_Signal.rebuild, E_Signal.reposition, E_Signal.alteration];
		for (const e_signal of all_t_signals) {
			this.adjust_highestPriority_forSignal(priority, e_signal);
		}
	}

}

export const signals = new Signals();
