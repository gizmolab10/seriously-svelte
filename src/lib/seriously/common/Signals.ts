import { Signal } from 'typed-signals';

export enum SignalKinds {
  relayout = 'r',
  widget   = 'w', // for widget hover and edit/stop
  dot      = 'd'  // refresh all the dots, for hover
}

export let handleSignal = new Signal<(kinds: SignalKinds[], value: any) => void>();
export function signal(kinds: SignalKinds[], value: any) { handleSignal.emit(kinds, value); }