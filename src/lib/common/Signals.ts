import { Signal } from 'typed-signals';

export enum Signals {
  grab = 'g', // for widget hover and edit/stop
  here = 'h',
  dots = 'd'  // refresh all the dots, for hover
}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }
export function signalMultiple(kinds: Signals[], value: any = null) { handleSignal.emit(kinds, value); }


export function handleSignalOfKind(kind: Signals, onSignal: (optionalValue: any | null) => any ) { 
	handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
      onSignal(value);
    }})
  }