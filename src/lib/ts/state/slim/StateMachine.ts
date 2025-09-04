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
