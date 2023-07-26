import { Signal } from 'typed-signals';

export enum Signals {
  widgets = 'w', // for widget hover and edit/stop
  dots    = 'd'  // refresh all the dots, for hover
}

export const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }
export function signalMultiple(kinds: Signals[], value: any = null) { handleSignal.emit(kinds, value); }