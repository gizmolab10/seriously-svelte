import { writable } from 'svelte/store';
import { SignalBridge } from './SignalBridge';
import { createStateMachine } from './StateMachine';
import type { SlimState } from './types';

export function createPhaseOneStore() {
    const machine = createStateMachine({
        states: ['idle', 'layoutComputing', 'componentsComputing', 'done'],
        transitions: {
            idle: ['layoutComputing'],
            layoutComputing: ['componentsComputing'],
            componentsComputing: ['done'],
            done: ['idle']
        }
    }, 'idle');

    const bridge = new SignalBridge(machine);
    
    const { subscribe, update } = writable<SlimState>({
        hover: {
            current: null,
            config: new Map()
        },
        components: {
            active: new Map(),
            state: machine
        }
    });

    return {
        subscribe,
        async transition(newState: string) {
            await machine.transition(newState);
            await bridge.emitLegacySignal(newState);
            update(s => ({
                ...s,
                components: {
                    ...s.components,
                    state: machine
                }
            }));
        }
    };
}
