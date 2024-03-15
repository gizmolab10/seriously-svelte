import { s_path_here } from './State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum IDSignal {
	alterParent = 'alterParent',
	relayout	= 'relayout',
	rebuild		= 'rebuild',
}

export class Signals {
	signal_isInFlight = false;

	signal_rebuildWidgets_fromHere() { this.signal_rebuildWidgets(get(s_path_here)); }
	signal_relayoutWidgets_fromHere() { this.signal_relayoutWidgets(get(s_path_here)); }
	handleSignal = new Signal<(IDSignal: Array<IDSignal>, value: any) => void>();
	signal_rebuildWidgets(value: any = null) { this.signal(IDSignal.rebuild, value); }
	signal_relayoutWidgets(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_alteringParent(value: any = null) { this.signal(IDSignal.alterParent, value); }

	handle_rebuildWidgets(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(IDSignal.rebuild, onSignal);
	}

	handle_relayoutWidgets(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(IDSignal.relayout, onSignal);
	}

	handle_alteringParent(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(IDSignal.alterParent, onSignal);
	}

	handleAnySignal(onSignal: (IDSignal: Array<IDSignal>, value: any | null) => any ) {
		return this.handleSignal.connect((IDSignal, value) => {
			onSignal(IDSignal, value);
		})
	}

	handleSignalOfKind(kind: IDSignal, onSignal: (value: any | null) => any ) {
		return this.handleSignal.connect((IDSignal, value) => {
			if (IDSignal.includes(kind)) {
				onSignal(value);
			}
		})
	}

	signal(kind: IDSignal, value: any = null) {
		if (this.signal_isInFlight) {
			console.log(`signal ${kind} in flight`);
		} else {
			this.signal_isInFlight = true;
			this.handleSignal.emit([kind], value);
			this.signal_isInFlight = false;
		}
	}

}

export const signals = new Signals();
