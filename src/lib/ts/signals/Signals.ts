import { T_SvelteComponent } from '../common/Enumerations';
import Svelte_Wrapper from '../common/Svelte_Wrapper';
import { w_ancestry_focus } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { debug } from '../debug/Debug';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum T_Signal {
	thing		 = 'thing',
	rebuild		 = 'rebuild',
	reattach	 = 'reattach',
	reposition	 = 'reposition',
	alteration	 = 'alteration',
	needsWrapper = 'needsWrapper',
}

class Signal_Wrapper {
	t_signal!: T_Signal;
	wrapper!: Svelte_Wrapper;
	closure!: (t_signal: T_Signal, value: any | null) => any;
	dummy_wrapper = new Svelte_Wrapper(null, null, null, T_SvelteComponent.none);

	constructor(t_signal: T_Signal, wrapper: Svelte_Wrapper, closure: (t_signal: T_Signal, value: any | null) => any) {
		this.t_signal = t_signal;
		this.wrapper = wrapper;
		this.closure = closure;
	}

	emit(value: any | null) {
		debug.log_signal(`EMITTED with ${value} on ${this.wrapper.description}`);
		this.closure(this.t_signal, value);
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
			debug.log_signal(`NOT SENDING ${t_signal} in flight`);
		} else if (!this.signal_isInFlight_for(T_Signal.rebuild) ||	// also, if rebuild is in progress
			t_signal != T_Signal.reposition) {					// suppress reposition
			this.set_signal_isInFlight_for(t_signal, true);
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				const signal_wrapper = this.wrapper_for(t_signal, priority);
				if (!!signal_wrapper) {
					signal_wrapper.emit(value);
				}
			}
			this.set_signal_isInFlight_for(t_signal, false);
		}
	}

	static readonly _____RECEIVING: unique symbol;

	// each handler has a signal type, a priority and a closure
	// the closure is called with just the type and the signal's value
	// on each signal's emit whose type and priority match

	handle_signal_atPriority(t_signal: T_Signal, priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([t_signal], priority, onSignal);
	}

	handle_signals_atPriority(t_signals: Array<T_Signal>, priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forSignals(priority, t_signals);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			for (const t_signal of t_signals) {
				if (received_t_signal == t_signal && signalPriority == priority) {
					// debug.log_signal`(ONLY) ${t_signal} at ${priority}`);
					onSignal(t_signal, value);
				}
			}
		});
	}

	handle_anySignal_atPriority(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		this.adjust_highestPriority_forAllSignals(priority);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				// debug.log_handle(`(ANY as: ${received_t_signal}) at ${priority}`);
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
				this.register_wrapper_for(t_signals, priority, wrapper, onSignal);
				signal_handler = this.handle_signals_atPriority(t_signals, priority, onSignal);
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
				this.register_wrapper_for(t_signals, priority, wrapper, onSignal);
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

	handle_rebuild_andReattach(priority: number, onSignal: (value: any | null) => any) {
		return this.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], priority, onSignal);
	}

	handle_reposition_widgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.reposition, priority, onSignal);
	}

	handle_blink_forAlteration(onSignal: (value: any | null) => any ) {
		return this.handle_signal_atPriority(T_Signal.alteration, 0, onSignal);
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
		return `${priority}:${t_signal}`;
	}

	wrapper_for(t_signal: T_Signal, priority: number): Signal_Wrapper | undefined {
		const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
		return this.wrappers_byType_andPriority[type_andPriority];
	}

	register_wrapper_for(t_signals: Array<T_Signal>, priority: number, wrapper: Svelte_Wrapper, onSignal: (t_signal: T_Signal, value: any | null) => any) {
		for (const t_signal of t_signals) {
			const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
			this.wrappers_byType_andPriority[type_andPriority] = new Signal_Wrapper(t_signal, wrapper, onSignal);
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
