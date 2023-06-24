import { Signal } from "typed-signals";

export let fetchCompleted = new Signal<(text: string, object: any) => void>();
export let updateWidgets = new Signal<(text: string, object: any) => void>();

export function signalFetchCompleted(text: string, object: any = null) {
  fetchCompleted.emit(text, object);
}

export function signalWidgetsNeedUpdate(text: string, object: any = null) {
  updateWidgets.emit(text, object);
}