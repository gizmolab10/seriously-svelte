# Project Slim: State Management Simplification

## Table of Contents
- [Goals](#goals)
- [Current Pain Points](#current-pain-points)
- [Solution: State Machine + Consolidated Store](#solution-state-machine--consolidated-store)
  - [Architecture](#architecture)
  - [Key Benefits](#key-benefits)
- [Implementation Guide](#implementation-guide)
  - [1. State Machine Core](#1-state-machine-core)
  - [2. Store Integration](#2-store-integration)
- [Migration Path](#migration-path)
- [Usage Examples](#usage-examples)
  - [Component Implementation](#component-implementation)
  - [Hover Management](#hover-management)
- [Testing Strategy](#testing-strategy)
- [Risks and Mitigations](#risks-and-mitigations)
- [Success Metrics](#success-metrics)
- [Timeline](#timeline)
- [Future Considerations](#future-considerations)
- [Test Structure](#test-structure)
  - [1. FOUNDATION](#1-foundation)
  - [2. MIGRATION SAFETY](#2-migration-safety)
  - [3. PRODUCTION READINESS](#3-production-readiness)

## Goals
1. Simplify complex state management
2. Maintain strict ordering guarantees
3. Reduce codebase complexity
4. Improve maintainability

## Current Pain Points
1. Complex priority-based signal system
2. Difficult to track component lifecycle
3. Over-engineered hover state management
4. Multiple overlapping state stores

## Solution: State Machine + Consolidated Store

### Architecture
```typescript
// Core state machine
export interface SlimStateMachine {
    states: ['idle', 'layoutComputing', 'componentsComputing', 'done']
    transitions: {
        idle: ['layoutComputing'],
        layoutComputing: ['componentsComputing'],
        componentsComputing: ['done']
    }
}

// Consolidated UI state
export interface UIState {
    hover: {
        current: null | string,
        config: Map<string, HoverConfig>
    },
    components: {
        active: Map<string, ComponentState>,
        state: SlimStateMachine
    }
}
```

### Key Benefits
1. **Explicit State Flow**
   - Clear, named states vs numeric priorities
   - Impossible to enter invalid states
   - Self-documenting transitions

2. **Simplified Debugging**
   - Each state has clear meaning
   - Easy to track current system state
   - Clear error boundaries

3. **Better Maintainability**
   - Fewer files to modify
   - Clear component lifecycle
   - Type-safe state transitions

## Implementation Guide

### 1. State Machine Core
```typescript
/**
 * Creates a type-safe state machine for managing component state transitions
 * 
 * @param config - State machine configuration
 * @param initialState - Starting state
 * @returns State machine instance
 * 
 * @example
 * ```typescript
 * const store = createStateMachine({
 *   states: ['idle', 'computing', 'done'],
 *   transitions: {
 *     idle: ['computing'],
 *     computing: ['done'],
 *     done: ['idle']
 *   }
 * });
 * ```
 */
export function createStateMachine<T extends string>(
    config: StateMachineConfig<T>,
    initialState: T
): StateMachine<T>
```

### 2. Store Integration
```typescript
/**
 * Creates a Svelte store with state machine integration
 * 
 * @param config - Store configuration including state machine setup
 * @returns Svelte store with state machine capabilities
 * 
 * @example
 * ```typescript
 * const uiStore = createSlimStore({
 *   initial: { hover: null, components: new Map() },
 *   machine: {
 *     states: ['idle', 'updating', 'done'],
 *     transitions: { /*...*/ }
 *   }
 * });
 * ```
 */
export function createSlimStore<T>(config: SlimStoreConfig<T>): SlimStore<T>
```

## Migration Path

1. **Phase 1: State Machine Introduction**
   - Implement core state machine
   - Add to existing system without removing old code
   - Begin using in new components

2. **Phase 2: Store Consolidation**
   - Create new consolidated store
   - Gradually migrate state from old stores
   - Update components to use new store

3. **Phase 3: Legacy Cleanup**
   - Remove old priority system
   - Clean up unused stores
   - Remove legacy state management

## Usage Examples

### Component Implementation
```typescript
// Before
signal(T_Signal.reposition, priority=1);
signal(T_Signal.rebuild, priority=2);

// After
store.transition('layoutComputing');
updateLayout();
store.transition('componentsComputing');
updateComponents();
store.transition('done');
```

### Hover Management
```typescript
// Before
s_mouse.isHover = isHit;
s_mouse.isOut = !isHit;
handle_s_mouse(S_Mouse.hover(null, bound_element, isHit));

// After
uiStore.update(s => ({
    ...s,
    hover: {
        current: isHit ? elementId : null,
        config: s.hover.config
    }
}));
```

## Testing Strategy

1. **State Transitions**
   - Test all valid transitions
   - Verify invalid transitions throw
   - Check state history

2. **Component Integration**
   - Verify correct state flow
   - Test error conditions
   - Check cleanup

3. **Performance Testing**
   - Compare with old system
   - Check memory usage
   - Verify no performance regression

## Risks and Mitigations

1. **Risk**: Migration complexity
   **Mitigation**: Phased approach with parallel systems

2. **Risk**: Missing edge cases
   **Mitigation**: Comprehensive state machine testing

3. **Risk**: Performance impact
   **Mitigation**: Early performance testing, optimization if needed

## Success Metrics

1. Reduced codebase size (target: -30%)
2. Fewer state-related bugs
3. Improved development velocity
4. Better test coverage
5. Clearer component lifecycle

## Timeline

1. Phase 1: 2 weeks
2. Phase 2: 3 weeks
3. Phase 3: 1 week
4. Testing & Optimization: 2 weeks

Total: 8 weeks

## Future Considerations

1. Add state persistence
2. Enhanced debugging tools
3. State visualization
4. Performance optimizations
5. Additional state patterns

## Test Structure

### Location: `/src/lib/ts/tests/slim/`

#### 1. FOUNDATION
```typescript
/core
  - StateMachine.test.ts     // Core state machine validation
  - DependencyOrder.test.ts  // Critical ordering guarantees
  - SlimStore.test.ts        // Store integration verification
```

#### 2. MIGRATION SAFETY
```typescript
/migration
  - Phase1Test.ts           // Coexistence Testing
    • state machine + priority signals work together
    • no race conditions between systems
    
  - Phase2Test.ts           // Store Transition Testing
    • store consolidation maintains state
    • dual-store operations are atomic
    
  - Phase3Test.ts           // Clean Removal Testing
    • system stable after priority removal
    • no memory leaks from cleanup
    
  - MigrationUtils.ts       // Shared migration utilities
```

#### 3. PRODUCTION READINESS
```typescript
/integration
  - ComponentLifecycle.test.ts  // Component mount/unmount flows
  - StateSequence.test.ts       // State transition sequences
  - StoreUpdates.test.ts        // Store synchronization
  - LoadTest.test.ts            // High-load scenarios

/utils
  - StateMachineTester.ts       // Test utilities
  - DependencyTester.ts         // Dependency validation
  - TestCases.ts                // Shared test scenarios

/e2e
  - ComponentFlow.test.ts       // End-to-end flows
  - LoadTest.test.ts            // Production load testing
```

This new structure:

1. Lives in a dedicated Slim test directory
2. Maintains clear phase separation
3. Better reflects the project focus
4. Easier to find Slim-specific tests
