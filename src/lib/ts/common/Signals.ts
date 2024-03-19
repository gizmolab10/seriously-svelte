import { Signal } from 'typed-signals';
import { s_path_here } from './State';
import { get } from 'svelte/store';

export enum IDSignal {
	alterParent = 'alterParent',
	relayout	= 'relayout',
	rebuild		= 'rebuild',
}

export class Signals {
	signal_isInFlight = false;
	handler = new Signal<(IDSignal: Array<IDSignal>, value: any) => void>();

	signal_rebuildWidgets(value: any = null) { this.signal(IDSignal.rebuild, value); }
	signal_relayoutWidgets(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_alteringParent(value: any = null) { this.signal(IDSignal.alterParent, value); }
	signal_relayoutWidgets_fromHere() { this.signal_relayoutWidgets(get(s_path_here)); }
	signal_rebuildWidgets_fromHere() { this.signal_rebuildWidgets(get(s_path_here)); }

	handle_rebuildWidgets(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.rebuild, onSignal);
	}

	handle_relayoutWidgets(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.relayout, onSignal);
	}

	handle_alteringParent(onSignal: (value: any | null) => any ) {
		return this.handle_signalOfKind(IDSignal.alterParent, onSignal);
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
