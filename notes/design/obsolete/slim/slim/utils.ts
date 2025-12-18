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
