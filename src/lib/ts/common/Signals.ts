import { id_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';
let signal_isInFlight = false;

export enum Signals {
	addParent = 'p',
	relayout = 'l',
	rebuild = 'b',
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal_rebuild_fromHere() { signal_rebuild(get(id_here)); }
export function signal_relayout_fromHere() { signal_relayout(get(id_here)); }
export function signal_rebuild(value: any = null) { signal(Signals.rebuild, value); }
export function signal_relayout(value: any = null) { signal(Signals.relayout, value); }
export function signal_addParent(value: any = null) { signal(Signals.addParent, value); }

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

export function handle_addParent(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.addParent, onSignal);
}

function handleSignalOfKind(kind: Signals, onSignal: (value: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}
