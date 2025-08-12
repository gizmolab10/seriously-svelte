import Svelte_Wrapper from '../common/Svelte_Wrapper';
import { w_ancestry_focus } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { u } from '../common/Utilities';
import { debug } from '../debug/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum T_Signal {
	thing		 = 'thing',
	graph		 = 'graph',
	rebuild		 = 'rebuild',
	reattach	 = 'reattach',
	reposition	 = 'reposition',
	alteration	 = 'alteration',
	needsWrapper = 'needsWrapper',
}

class Signal_Wrapper {
	priority!: number;
	t_signal!: T_Signal;
	wrapper!: Svelte_Wrapper;

	constructor(t_signal: T_Signal, priority: number, wrapper: Svelte_Wrapper | null) {
		this.wrapper = wrapper ?? Svelte_Wrapper.dummy_wrapper;
		this.t_signal = t_signal;
		this.priority = priority;
	}

	log_signal(value: any | null) {
		const resolved = u.resolve_signal_value(value);
		debug.log_signal(`SEND ${this.t_signal} with ${resolved} on ${this.wrapper.description}`);
	}

}

export class Signals {
	signals_inFlight_byT_Signal: Dictionary<boolean> = {};
	wrappers_byType_andPriority: { [type_andPriority: string]: Signal_Wrapper } = {};
	signal_emitter = new Signal<(t_signal: T_Signal, priority: number, value: any) => void>();

	static readonly _____SENDING: unique symbol;

	// signal is called with a value and a type, but not a priority
	// emit is then called on the signal_emitter
	// for each priority (up to the highest requested for that type)
	// in increasing priority from 0 to highest
	
	signal_rebuildGraph_from(value: any = null) { this.signal(T_Signal.rebuild, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph_from(get(w_ancestry_focus)); }
	signal_blink_forAlteration(value: any = null) { this.signal(T_Signal.alteration, value); }
	signal_reattach_widgets_from(value: any = null) { this.signal(T_Signal.reattach, value); }
	signal_reposition_widgets_from(value: any = null) { this.signal(T_Signal.reposition, value); }
	signal_reattach_widgets_fromFocus() { this.signal_reattach_widgets_from(get(w_ancestry_focus)); }
	signal_reposition_widgets_fromFocus() { this.signal_reposition_widgets_from(get(w_ancestry_focus)); }

	signal(t_signal: T_Signal, value: any = null) {
		if (this.anySignal_isInFlight) {							// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SEND ${t_signal} in flight`);
		} else if (!this.signal_isInFlight_for(T_Signal.rebuild) ||	// also, if rebuild is in progress
			t_signal != T_Signal.reposition) {					// suppress reposition
			this.set_signal_isInFlight_for(t_signal, true);
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				const signal_wrapper = this.wrapper_for(t_signal, priority);
				if (!!signal_wrapper) {
					signal_wrapper.log_signal(value);
					this.signal_emitter.emit(t_signal, priority, value);
				}
			}
			this.set_signal_isInFlight_for(t_signal, false);
		}
	}

	static readonly _____RECEIVING: unique symbol;

	// each handler has a signal type, a priority and a closure
	// whereby, upon receipt of each signal,
	// whose type and priority are a match
	// the closure is called
	// with just the type and the signal's value

	handle_signals_atPriority(t_signals: Array<T_Signal>, priority: number, wrapper: Svelte_Wrapper | null, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forSignals(priority, t_signals);
		this.register_wrapper_for(t_signals, priority, wrapper);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			const resolved = u.resolve_signal_value(value);
			for (const t_signal of t_signals) {
				if (received_t_signal == t_signal && signalPriority == priority) {
					const type_andPriority = this.combined_type_andPriority_for(received_t_signal, priority);
					debug.log_signal(`HANDLE ${type_andPriority} with ${resolved}`);
					onSignal(t_signal, value);
				}
			}
		});
	}

	handle_anySignal_atPriority(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forAllSignals(priority);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				const resolved = u.resolve_signal_value(value);
				const type_andPriority = this.combined_type_andPriority_for(received_t_signal, priority);
				debug.log_signal(`HANDLE ${type_andPriority} with ${resolved}`);
				onSignal(received_t_signal, value);
			}
		});
	}

	// some handlers have a svelte wrapper
	// used for debugging signal closure activity
	// those that don't use a shared dummy wrapper

	handle_signals_atPriority_needsWrapper(t_signals: Array<T_Signal>, priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any) {
		let signal_handler: any;
		const interval = setInterval(() => {
			const wrapper = onSignal(T_Signal.needsWrapper, null);	// value of null is ignored
			if (!!wrapper) {
				clearInterval(interval);
				signal_handler = this.handle_signals_atPriority(t_signals, priority, wrapper, onSignal);
			}
		}, 100);
		return {
			disconnect: () => {
				clearInterval(interval);	// just in case
				signal_handler?.disconnect();
			}
		};
	}


	handle_anySignal_atPriority_needsWrapper(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => Svelte_Wrapper | null ) {
		let signal_handler: any;
		const interval = setInterval(() => {
			const wrapper = onSignal(T_Signal.needsWrapper, null);	// value of null is ignored
			if (!!wrapper) {
				clearInterval(interval);
				const t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.reposition, T_Signal.alteration];
				this.register_wrapper_for(t_signals, priority, wrapper);
				signal_handler = this.handle_anySignal_atPriority(priority, onSignal);
			}
		}, 100);
		return {
			disconnect: () => {
				clearInterval(interval);	// just in case
				signal_handler?.disconnect();
			}
		};
	}

	handle_reposition_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([T_Signal.reposition], priority, null, onSignal);
	}

	static readonly _____TRACKING: unique symbol;

	get anySignal_isInFlight(): boolean {
		return Object.values(this.signals_inFlight_byT_Signal).some(flag => !!flag);
	}

	set_signal_isInFlight_for(t_signal: T_Signal, flag: boolean) {
		this.signals_inFlight_byT_Signal[t_signal] = flag;
	}

	signal_isInFlight_for(t_signal: T_Signal): boolean {
		return this.signals_inFlight_byT_Signal[t_signal];
	}

	combined_type_andPriority_for(t_signal: T_Signal, priority: number): string {
		return `${t_signal}(${priority})`;
	}

	wrapper_for(t_signal: T_Signal, priority: number): Signal_Wrapper | undefined {
		const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
		return this.wrappers_byType_andPriority[type_andPriority];
	}

	register_wrapper_for(t_signals: Array<T_Signal>, priority: number, wrapper: Svelte_Wrapper | null) {
		for (const t_signal of t_signals) {
			const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
			this.wrappers_byType_andPriority[type_andPriority] = new Signal_Wrapper(t_signal, priority, wrapper);
		}
	}

	static readonly _____PRIORITY: unique symbol;

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
		const all_t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.reposition, T_Signal.alteration];
		for (const t_signal of all_t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

}

export const signals = new Signals();
