import { s_focus_ancestry, s_rebuild_isInProgress } from '../state/Svelte_Stores';
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
	highestPriorities: { [id_signal: string]: number } = {}
	handler = new Signal<(ids_signal: Array<IDSignal>, value: any, priority: number) => void>();

	signal_altering(value: any = null) { this.signal(IDSignal.alterState, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph(get(s_focus_ancestry)); }
	signal_relayoutWidgets(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_relayoutWidgets_fromFocus() { this.signal_relayoutWidgets(get(s_focus_ancestry)); }

	handle_rebuildGraph(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, IDSignal.rebuild, onSignal);
	}

	handle_relayoutWidgets(priority: number, onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(priority, IDSignal.relayout, onSignal);
	}

	handle_altering(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(0, IDSignal.alterState, onSignal);
	}

	handle_anySignal(onSignal: (ids_signal: Array<IDSignal>, value: any | null) => any ) {
		return this.handler.connect((ids_signal, value) => {
			onSignal(ids_signal, value);
		});
	}

	handle_signalOfKind(priority: number, id_signal: IDSignal, onSignal: (value: any | null) => any ) {
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

	signal(id_signal: IDSignal, value: any = null) {
		if (this.signal_isInFlight) {
			console.log(`signal ${id_signal} in flight`);
		} else if (!get(s_rebuild_isInProgress) ||		// if rebuild is in progress
			id_signal != IDSignal.relayout) {			// disable relayout
			this.signal_isInFlight = true;
			const highestPriority = this.highestPriorities[id_signal] ?? 0;
			for (let priority = 0; priority <= highestPriority; priority++) {
				this.handler.emit([id_signal], value, priority);
			}
			this.signal_isInFlight = false;
		}
	}

	signal_rebuildGraph(value: any = null) {
		s_rebuild_isInProgress.set(true);
		this.signal(IDSignal.rebuild, value);
		s_rebuild_isInProgress.set(false);				// N.B., widget whatches this to reveal tools
	}

}

export const signals = new Signals();
