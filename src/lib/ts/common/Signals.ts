import { s_path_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum SignalKind {
	alterParent = 'p',
	relayout	= 'l',
	rebuild		= 'b',
}

export class Signals {
	signal_isInFlight = false;
	handleSignal = new Signal<(kinds: Array<SignalKind>, value: any) => void>();
	signal_rebuild_fromHere() { this.signal_rebuild(get(s_path_here)); }
	signal_relayout_fromHere() { this.signal_relayout(get(s_path_here)); }
	signal_rebuild(value: any = null) { this.signal(SignalKind.rebuild, value); }
	signal_relayout(value: any = null) { this.signal(SignalKind.relayout, value); }
	signal_alteringParent(value: any = null) { this.signal(SignalKind.alterParent, value); }

	signal(kind: SignalKind, value: any = null) {
		if (this.signal_isInFlight) {
			console.log(`signal ${kind} in flight`);
		} else {
			this.signal_isInFlight = true;
			this.handleSignal.emit([kind], value);
			this.signal_isInFlight = false;
		}
	}

	handle_rebuild(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(SignalKind.rebuild, onSignal);
	}

	handle_relayout(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(SignalKind.relayout, onSignal);
	}

	handle_alteringParent(onSignal: (value: any | null) => any ) {
		return this.handleSignalOfKind(SignalKind.alterParent, onSignal);
	}

	handleSignalOfKind(kind: SignalKind, onSignal: (value: any | null) => any ) {
		return this.handleSignal.connect((kinds, value) => {
			if (kinds.includes(kind)) {
				onSignal(value);
			}
		})
	}

	handleAnySignal(onSignal: (kinds: Array<SignalKind>, value: any | null) => any ) {
		return this.handleSignal.connect((kinds, value) => {
			onSignal(kinds, value);
		})
	}

}

export const signals = new Signals();
