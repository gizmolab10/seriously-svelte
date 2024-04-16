import { Signal } from 'typed-signals';
import { s_path_focus } from '../state/State';
import { get } from 'svelte/store';

export enum IDSignal {
	rebuild	   = 'rebuild',
	relayout   = 'relayout',
	alterState = 'alterState',
}

export class Signals {
	signal_isInFlight = false;
	handler = new Signal<(IDSignal: Array<IDSignal>, value: any) => void>();

	signal_rebuildGraph(value: any = null) { this.signal(IDSignal.rebuild, value); }
	signal_rebuildGraph_fromFocus() { this.signal_rebuildGraph(get(s_path_focus)); }
	signal_alterState(value: any = null) { this.signal(IDSignal.alterState, value); }
	signal_relayoutWidgets(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_relayoutWidgets_fromFocus() { this.signal_relayoutWidgets(get(s_path_focus)); }

	handle_rebuildGraph(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.rebuild, onSignal);
	}

	handle_relayoutWidgets(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.relayout, onSignal);
	}

	handle_alterState(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.alterState, onSignal);
	}

	handle_anySignal(onSignal: (IDSignal: Array<IDSignal>, value: any | null) => any ) {
		return this.handler.connect((IDSignal, value) => {
			onSignal(IDSignal, value);
		});
	}

	handle_signalOfKind(kind: IDSignal, onSignal: (value: any | null) => any ) {
		return this.handler.connect((IDSignal, value) => {
			if (IDSignal.includes(kind)) {
				onSignal(value);
			}
		});
	}

	signal(kind: IDSignal, value: any = null) {
		if (this.signal_isInFlight) {
			console.log(`signal ${kind} in flight`);
		} else {
			this.signal_isInFlight = true;
			this.handler.emit([kind], value);
			this.signal_isInFlight = false;
		}
	}

}

export const signals = new Signals();
