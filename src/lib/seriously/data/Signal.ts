import { createEventDispatcher } from 'svelte';

enum SignalAction {
  refresh  = 'refresh',
  relayout = 'relayout'
}

export default class Signal {
  action: SignalAction;
  text: string;
  object: any;

  constructor(action: SignalAction, text: string, object: any = null) {
    this.action = action;
    this.text = text;
    this.object = object;
  }
}

const dispatch = createEventDispatcher();

export function dispatchSignal(action: SignalAction, text: string, object: any = null) {
  const signal = new Signal(action, text, object);

  dispatch('message', signal);
}