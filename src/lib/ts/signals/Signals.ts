import { w_ancestry_focus } from '../managers/Stores';
import { components } from '../managers/Components';
import type { Dictionary } from '../common/Types';
import { T_Signal } from '../common/Enumerations';
import S_Component from '../state/S_Component';
import { Signal } from 'typed-signals';
import { debug } from '../debug/Debug';
import { get } from 'svelte/store';

export class Signals {
	signals_inFlight_byT_Signal: Dictionary<boolean> = {};
	signal_emitter = new Signal<(t_signal: T_Signal, priority: number, value: any) => void>();

	static readonly _____SENDING: unique symbol;

	// signal is called with a value and a type, but not a priority
	// emit is then called on the signal_emitter
	// for each priority (up to the highest requested for that type)
	// in increasing priority from 0 to highest
	
	signal_rebuildGraph_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.rebuild, value, component); }
	signal_rebuildGraph_fromFocus(component: S_Component | null = null) { this.signal_rebuildGraph_from(get(w_ancestry_focus), component); }
	signal_blink_forAlteration(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.alteration, value, component); }
	signal_reattach_widgets_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.reattach, value, component); }
	signal_reposition_widgets_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.reposition, value, component); }
	signal_reattach_widgets_fromFocus(component: S_Component | null = null) { this.signal_reattach_widgets_from(get(w_ancestry_focus), component); }
	signal_reposition_widgets_fromFocus(component: S_Component | null = null) { this.signal_reposition_widgets_from(get(w_ancestry_focus), component); }

	signal(t_signal: T_Signal, value: any = null, component: S_Component | null = null) {
		if (this.anySignal_isInFlight) {							// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SEND ${t_signal} in flight`);
		} else if (!this.signal_isInFlight_for(T_Signal.rebuild) ||	// also, if rebuild is in progress
			t_signal != T_Signal.reposition) {					// suppress reposition
			this.set_signal_isInFlight_for(t_signal, true);
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				components.component_for(t_signal, priority, component)?.log_signal(true, value, t_signal, priority);
				this.signal_emitter.emit(t_signal, priority, value);
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

	handle_signals_atPriority(t_signals: Array<T_Signal>, priority: number, component: S_Component, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		if (!component) { 
			console.log('no component');
		}
		this.adjust_highestPriority_forSignals(priority, t_signals);
		components.component_registerFor(t_signals, priority, component);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			for (const t_signal of t_signals) {
				if (received_t_signal == t_signal && signalPriority == priority) {
					components.component_for(received_t_signal, priority, component)?.log_signal(false, value, received_t_signal, signalPriority);
					onSignal(t_signal, value);
				}
			}
		});
	}

	handle_anySignal_atPriority(priority: number, component: S_Component | null, onSignal: (t_signal: T_Signal, value: any | null) => any ) {
		if (!component) { 
			console.log('no component');
		}
		this.adjust_highestPriority_forAllSignals(priority);
		return this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				components.component_for(received_t_signal, priority, component)?.log_signal(false, value, received_t_signal, signalPriority);
				onSignal(received_t_signal, value);
			}
		});
	}

	// some handlers have a svelte component
	// used for debugging signal closure activity
	// those that don't use a shared dummy component

	handle_signals_atPriority_needsComponent(t_signals: Array<T_Signal>, priority: number, onSignal: (t_signal: T_Signal, value: any | null) => any) {
		let signal_handler: any;
		const interval = setInterval(() => {
			const component = onSignal(T_Signal.needsComponent, null);	// value of null is ignored
			if (!!component) {
				clearInterval(interval);
				signal_handler = this.handle_signals_atPriority(t_signals, priority, component, onSignal);
			}
		}, 100);
		return {
			disconnect: () => {
				clearInterval(interval);	// just in case
				signal_handler?.disconnect();
			}
		};
	}


	handle_anySignal_atPriority_needsComponent(priority: number, onSignal: (t_signal: T_Signal, value: any | null) => S_Component | null ) {
		let signal_handler: any;
		const interval = setInterval(() => {
			const component = onSignal(T_Signal.needsComponent, null);
			if (!!component) {		// component of null is ignored
				clearInterval(interval);
				const t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.reposition, T_Signal.alteration];
				components.component_registerFor(t_signals, priority, component);
				signal_handler = this.handle_anySignal_atPriority(priority, component, onSignal);
			}
		}, 100);
		return {
			disconnect: () => {
				clearInterval(interval);	// just in case
				signal_handler?.disconnect();
			}
		};
	}

	handle_reposition_widgets(priority: number, component: S_Component, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([T_Signal.reposition], priority, component, onSignal);
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
