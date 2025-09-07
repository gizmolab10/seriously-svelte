import { writable } from 'svelte/store';
import type { StateMachine } from './StateMachine';

export interface SlimState {
    hover: {
        current: string | null;
        config: Map<string, any>;
    };
    components: {
        active: Map<string, any>;
        state: StateMachine<string>;
    };
}

export function createSlimStore(config: {
    initial: Partial<SlimState>;
    machine: StateMachine<string>;
}) {
    const { subscribe, update } = writable<SlimState>({
        hover: {
            current: null,
            config: new Map()
        },
        components: {
            active: new Map(),
            state: config.machine
        },
        ...config.initial
    });

    return {
        subscribe,
        async transition(newState: string) {
            await config.machine.transition(newState);
            update(s => ({
                ...s,
                components: {
                    ...s.components,
                    state: config.machine
                }
            }));
        },
        updateHover(elementId: string | null) {
            update(s => ({
                ...s,
                hover: {
                    ...s.hover,
                    current: elementId
                }
            }));
        }
    };
}
