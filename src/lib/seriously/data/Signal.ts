import { Signal } from "typed-signals";

export enum SignalAction {
  fetch  = 'refresh',
  relayout = 'relayout'
}

export let signal = new Signal<(action: SignalAction, text: string, object: any) => void>();

export function dispatchSignal(action: SignalAction, text: string, object: any = null) {
  signal.emit(action, text, object);
}