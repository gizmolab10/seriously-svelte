import { createLegacySystem, createStateMachine } from '../../../state/slim/StateMachine';
import { T_Signal } from '../../../common/Global_Imports';

describe('Phase 1: Coexistence', () => {
    test('state machine works alongside priority system', () => {
        const oldSystem = createLegacySystem();
        const newSystem = createStateMachine({/*...*/}, 'idle');
        
        oldSystem.signal(T_Signal.reposition, 1);
        newSystem.transition('layoutComputing');
        
        expect(oldSystem.isValid()).toBe(true);
        expect(newSystem.currentState).toBe('layoutComputing');
    });

    test('no interference between systems', async () => {
        const oldSystem = createLegacySystem();
        const newSystem = createStateMachine({/*...*/}, 'idle');
        
        await Promise.all([
            oldSystem.signal(T_Signal.reposition, 1),
            newSystem.transition('layoutComputing')
        ]);
        
        expect(oldSystem.getState()).toBe('expected');
        expect(newSystem.currentState).toBe('layoutComputing');
    });
});
