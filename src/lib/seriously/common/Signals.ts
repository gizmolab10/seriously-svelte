import { Signal } from 'typed-signals';

export enum Signals {
  relayout = 'r',
  crumbs   = 'c',
  widget   = 'w', // for widget hover and edit/stop
  dot      = 'd'  // refresh all the dots, for hover
}

export const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal(kind: Signals, value: any = null) { handleSignal.emit([kind], value); }
export function signalMultiple(kinds: Signals[], value: any = null) { handleSignal.emit(kinds, value); }