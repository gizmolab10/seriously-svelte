# Create directories
mkdir -p /Users/sand/GitHub/webseriously/src/lib/ts/state/slim

# Create source files
cat << 'EOF' > /Users/sand/GitHub/webseriously/src/lib/ts/state/slim/StateMachine.ts
export interface StateMachineConfig<T extends string> {
    states: T[];
    transitions: Record<T, T[]>;
}

export class StateMachine<T extends string> {
    private currentState: T;
    private history: T[] = [];

    constructor(private config: StateMachineConfig<T>, initialState: T) {
        this.currentState = initialState;
        this.history.push(initialState);
    }

    async transition(newState: T): Promise<void> {
        if (!this.isValidTransition(newState)) {
            throw new Error(`Invalid transition: ${this.currentState} → ${newState}`);
        }
        this.currentState = newState;
        this.history.push(newState);
    }

    private isValidTransition(newState: T): boolean {
        return this.config.transitions[this.currentState]?.includes(newState) ?? false;
    }

    getState(): T {
        return this.currentState;
    }

    getHistory(): T[] {
        return [...this.history];
    }
}
EOF

cat << 'EOF' > /Users/sand/GitHub/webseriously/src/lib/ts/state/slim/SlimStore.ts
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
EOF

cat << 'EOF' > /Users/sand/GitHub/webseriously/src/lib/ts/state/slim/types.ts
export type StateType = 'idle' | 'layoutComputing' | 'componentsComputing' | 'done';

export interface HoverConfig {
    color?: string;
    cursor?: string;
    invert?: boolean;
    ignore?: boolean;
    custom?: (event: MouseEvent) => void;
}

export interface ComponentState {
    id: string;
    isMounted: boolean;
    element: HTMLElement | null;
    customConfig?: Record<string, any>;
}
EOF

cat << 'EOF' > /Users/sand/GitHub/webseriously/src/lib/ts/state/slim/utils.ts
import type { StateType } from './types';

export function validateTransition(from: StateType, to: StateType): boolean {
    const validTransitions: Record<StateType, StateType[]> = {
        'idle': ['layoutComputing'],
        'layoutComputing': ['componentsComputing'],
        'componentsComputing': ['done'],
        'done': ['idle']
    };
    
    return validTransitions[from]?.includes(to) ?? false;
}

export function createInitialState() {
    return {
        hover: {
            current: null,
            config: new Map()
        },
        components: {
            active: new Map(),
            state: null
        }
    };
}
EOF