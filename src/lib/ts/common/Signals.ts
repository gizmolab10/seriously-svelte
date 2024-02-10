import { s_path_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum IDSignal {
	alterParent = 'p',
	relayout	= 'l',
	rebuild		= 'b',
}

export class Signals {
	signal_isInFlight = false;

	signal_rebuild_fromHere() { this.signal_rebuild(get(s_path_here)); }
	signal_relayout_fromHere() { this.signal_relayout(get(s_path_here)); }
	handleSignal = new Signal<(IDSignal: Array<IDSignal>, value: any) => void>();
	signal_rebuild(value: any = null) { this.signal(IDSignal.rebuild, value); }
	signal_relayout(value: any = null) { this.signal(IDSignal.relayout, value); }
	signal_alteringParent(value: any = null) { this.signal(IDSignal.alterParent, value); }

	handle_rebuild(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(IDSignal.rebuild, onSignal);
	}

	handle_relayout(onSignal: (value: any | null) => any ) {
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
