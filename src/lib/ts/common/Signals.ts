import { path_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';
let signal_isInFlight = false;

export enum Signals {
	alterParent = 'p',
	relayout	= 'l',
	rebuild		= 'b',
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal_rebuild_fromHere() { signal_rebuild(get(path_here)); }
export function signal_relayout_fromHere() { signal_relayout(get(path_here)); }
export function signal_rebuild(value: any = null) { signal(Signals.rebuild, value); }
export function signal_relayout(value: any = null) { signal(Signals.relayout, value); }
export function signal_alteringParent(value: any = null) { signal(Signals.alterParent, value); }

export function signal(kind: Signals, value: any = null) {
	if (signal_isInFlight) {
		console.log(`signal ${kind} in flight`);
	} else {
		signal_isInFlight = true;
		handleSignal.emit([kind], value);
		signal_isInFlight = false;
	}
}

export function handle_rebuild(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.rebuild, onSignal);
}

export function handle_relayout(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.relayout, onSignal);
}

export function handle_alteringParent(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.alterParent, onSignal);
}

function handleSignalOfKind(kind: Signals, onSignal: (value: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}
