import { id_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum Signals {
	relayout = 'r',
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signalRelayout() { signal(Signals.relayout, get(id_here)); }
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }

export function handleRelayout(onSignal: (optionalValue: any | null) => any ) {
	return handleSignalOfKind(Signals.relayout, onSignal);
}

function handleSignalOfKind(kind: Signals, onSignal: (optionalValue: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}
