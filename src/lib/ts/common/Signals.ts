import { Signal } from 'typed-signals';

export enum Signals {
	childrenOf = 'c', // for parent thing whose children are being drawn
	dots = 'd',
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }
export function signalMultiple(kinds: Signals[], value: any = null) { handleSignal.emit(kinds, value); }

export function handleSignalOfKind(kind: Signals, onSignal: (optionalValue: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}