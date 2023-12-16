import { Signal } from 'typed-signals';

export enum Signals {
	children	= 'c',	// for parent thing whose children are being drawn
	layout		= 'l',	// layout children
	graph		= 'g',	// layout graph
	dot			= 'd',
}

const handleSignal = new Signal<(kinds: Signals[], visited: string[], value: any) => void>();
export function signal(kind: Signals, visited: string[], value: any = null) { handleSignal.emit([kind], visited, value); }
export function signalMultiple(kinds: Signals[], visited: string[], value: any = null) { handleSignal.emit(kinds, visited, value); }

export function handleSignalOfKind(kind: Signals, onSignal: (visited: string[], optionalValue: any | null) => any ) {
	return handleSignal.connect((kinds, visited, value) => {
		if (kinds.includes(kind)) {
			onSignal(visited, value);
		}
	})
}