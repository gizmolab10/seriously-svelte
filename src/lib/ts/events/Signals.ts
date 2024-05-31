import { s_ancestry_focus } from '../state/ReactiveState';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum IDSignal {
	thing	   = 'thing',
	rebuild	   = 'rebuild',
	relayout   = 'relayout',
	alterState = 'alterState',
}

export class Signals {
	signal_isInFlight = false;
	highestPriorities: { [kind: string]: number } = {}
	handler = new Signal<(signalKind: Array<IDSignal>, value: any, priority: number) => void>();

	signal_rebuildGraph(value: any = null) { this.signal(IDSignal.rebuild, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph(get(s_ancestry_focus)); }
	signal_altering(value: any = null) { this.signal(IDSignal.alterState, value); }
	signal_relayoutWidgets(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_relayoutWidgets_fromFocus() { this.signal_relayoutWidgets(get(s_ancestry_focus)); }

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, IDSignal.rebuild, onSignal);
	}

	handle_relayoutWidgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, IDSignal.relayout, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(0, IDSignal.alterState, onSignal);
	}

	handle_anySignal(onSignal: (signalKind: Array<IDSignal>, value: any | null) => any ) {
		return this.handler.connect((signalKind, value) => {
			onSignal(signalKind, value);
		});
	}

	handle_signalOfKind(priority: number, kind: IDSignal, onSignal: (value: any | null) => any ) {
		const highestPriority = this.highestPriorities[kind];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[kind] = priority;
		}
		return this.handler.connect((signalKind, value, signalPriority) => {
			if (signalKind.includes(kind) && signalPriority == priority) {
				onSignal(value);
			}
		});
	}

	signal(kind: IDSignal, value: any = null) {
		if (this.signal_isInFlight) {
			console.log(`signal ${kind} in flight`);
		} else {
			this.signal_isInFlight = true;
			const highestPriority = this.highestPriorities[kind] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				this.handler.emit([kind], value, priority);
			}
			this.signal_isInFlight = false;
		}
	}

}

export const signals = new Signals();
