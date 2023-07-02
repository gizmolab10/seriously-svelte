import { Signal } from 'typed-signals';

export enum SignalKinds {
  widget = 'w',
  fetch  = 'f',
  dot    = 'd'
}

export let handleSignal = new Signal<(kinds: SignalKinds[], value: any) => void>();
export function signal(kinds: SignalKinds[], value: any) { handleSignal.emit(kinds, value); }