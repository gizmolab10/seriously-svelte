import { id_here } from '../managers/State';
import { Signal } from 'typed-signals';
import { get } from 'svelte/store';

export enum Signals {
	relayout = 'l',
	rebuild = 'b',
}

let priorSignals : {[kind: string] : number} = {}

const handleSignal = new Signal<(kinds: Signals[], value: any) => void>();
export function signal_rebuild() { signal(Signals.rebuild, get(id_here)); }
export function signal_relayout() { signal(Signals.relayout, get(id_here)); }

export function signal(kind: Signals, value: any = null) {
	const prior = priorSignals[kind];
	const now = new Date().getTime();
	if (prior == null || (now - prior) > 200) {
		priorSignals[kind] = now;
		handleSignal.emit([kind], value);
	}
}

export function handle_rebuild(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.rebuild, onSignal);
}

export function handle_relayout(onSignal: (value: any | null) => any ) {
	return handleSignalOfKind(Signals.relayout, onSignal);
}

function handleSignalOfKind(kind: Signals, onSignal: (value: any | null) => any ) {
	return handleSignal.connect((kinds, value) => {
		if (kinds.includes(kind)) {
			onSignal(value);
		}
	})
}
