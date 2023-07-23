import { Signal } from 'typed-signals';

export enum SignalKinds {
  relayout = 'r',
  crumbs   = 'c',
  widget   = 'w', // for widget hover and edit/stop
  dot      = 'd'  // refresh all the dots, for hover
}

export const handleSignal = new Signal<(kinds: SignalKinds[], value: any) => void>();
export function signal(kinds: SignalKinds[], value: any) { handleSignal.emit(kinds, value); }