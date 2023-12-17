import { id_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum Signals {
	childrenOf	= 'c', // for parent thing whose children are being drawn
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }
export function signalMultiple(kinds: Signals[], value: any = null) { handleSignal.emit(kinds, value); }
export function signalRelayout() {signal(Signals.childrenOf, get(id_here))}

export function handleSignalOfKind(kind: Signals, onSignal: (optionalValue: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}