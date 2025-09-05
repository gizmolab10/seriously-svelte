import { signals } from '../../../signals/Signals';
import { T_Signal } from '../../../common/Enumerations';
import { StateMachine } from '../../../slim/StateMachine';
import { writable } from 'svelte/store';

function createPhaseOneStore() {
    const machine = new StateMachine({
        states: ['idle', 'layoutComputing', 'componentsComputing', 'done'],
        transitions: {
            idle: ['layoutComputing'],
            layoutComputing: ['componentsComputing'],
            componentsComputing: ['done']
        }
    }, 'idle');
    
    const { subscribe, update } = writable({
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
        async transition(newState) {
            await machine.transition(newState);
            signals.signal_reposition_widgets_from();
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

describe('Phase 1: Coexistence', () => {
    it('state machine transitions trigger legacy signals', async () => {
        const store = createPhaseOneStore();
        const signalSpy = jest.spyOn(signals, 'signal_reposition_widgets_from');
        
        await store.transition('layoutComputing');
        
        expect(signalSpy).toHaveBeenCalled();
    });

    it('maintains state consistency during parallel operations', async () => {
        const store = createPhaseOneStore();
        const states = [];
        
        store.subscribe(state => {
            states.push(state.components.state.getState());
        });
        
        await Promise.all([
            store.transition('layoutComputing'),
            signals.signal_reposition_widgets_from()
        ]);
        
        expect(states).not.toContain(undefined);
        expect(states[states.length - 1]).toBe('layoutComputing');
    });
});