import { createSlimStore, removeLegacySystem } from '../../../state/slim/SlimStore';

describe('Phase 3: Legacy Cleanup', () => {
    test('system works after priority removal', () => {
        const store = createSlimStore({/*...*/});
        removeLegacySystem();
        
        store.transition('layoutComputing');
        expect(store.getState().machine.currentState).toBe('layoutComputing');
    });

    test('no memory leaks after cleanup', () => {
        const store = createSlimStore({/*...*/});
        const memoryBefore = process.memoryUsage();
        
        removeLegacySystem();
        const memoryAfter = process.memoryUsage();
        
        expect(memoryAfter.heapUsed).toBeLessThanOrEqual(memoryBefore.heapUsed);
    });
});
