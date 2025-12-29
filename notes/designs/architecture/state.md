# State Design: Why Svelte Needs State Objects

Svelte [[components]] are terrible at carrying state (most apps don't need it). my app does, a lot of it. thus, separate state objects. they have many flavors.

## Table of Contents
- [Overview](#overview)
- [The Problem: Svelte Component Lifecycle Limitations](#the-problem-svelte-component-lifecycle-limitations)
  - [Example: Component Recreation Problem](#example-component-recreation-problem)
- [Why State Objects?](#why-state-objects)
  - [1. **Survival Across Component Recreation**](#1-survival-across-component-recreation)
  - [2. **Single Source of Truth for Computed Properties**](#2-single-source-of-truth-for-computed-properties)
  - [3. **Cross-Component State Coordination**](#3-cross-component-state-coordination)
  - [4. **Manager Access Without Component Context**](#4-manager-access-without-component-context)
  - [5. **State Snapshots for Computation**](#5-state-snapshots-for-computation)
- [Current State Object Hierarchy](#current-state-object-hierarchy)
- [Alternatives Available Off-the-Shelf](#alternatives-available-off-the-shelf)
  - [1. **Svelte Stores Only** ❌ Insufficient](#1-svelte-stores-only--insufficient)
  - [2. **Pinia** (State Management Library)](#2-pinia-state-management-library)
  - [3. **Zustand** (Lightweight State Management)](#3-zustand-lightweight-state-management)
  - [4. **Svelte Context API**](#4-svelte-context-api)
  - [5. **Class Instances in Module Scope** (Our Approach)](#5-class-instances-in-module-scope-our-approach)
  - [6. **Redux/Flux Pattern**](#6-reduxflux-pattern)
  - [7. **MobX** (Reactive State Management)](#7-mobx-reactive-state-management)
- [Why Our Approach (And Why It's Not Widely Documented)](#why-our-approach-and-why-its-not-widely-documented)
- [Key Insights](#key-insights)
- [Related Documents](#related-documents)

## Overview

This document explains why Webseriously uses state objects (classes prefixed with `S_`) alongside Svelte stores, explores alternatives available off-the-shelf, and discusses why this pattern isn't widely documented in the Svelte community (hint: most applications don't need it).

## The Problem: Svelte Component Lifecycle Limitations

Svelte components have a fundamental limitation: **component-local state is ephemeral** — it's destroyed when components are recreated. This creates problems in complex applications where:

1. **Components recreate frequently** — When reactive dependencies change, Svelte destroys and recreates components
2. **State must persist across recreations** — UI state (hover, grab, edit) should survive component destruction
3. **Multiple components share state** — Related components (widget + drag dot + reveal dot) need coordinated state
4. **Cross-component coordination** — State objects allow managers to track and update state independently of component lifecycle

### Example: Component Recreation Problem

**Without State Objects:**
```typescript
// Component local state — LOST on recreation
let isHovering = false;
let autorepeat_event: MouseEvent | null = null;

function handleMouseEnter() {
    isHovering = true;
    // ... user triggers action that causes component to recreate ...
    // ❌ isHovering and autorepeat_event are LOST
}
```

**With State Objects:**
```typescript
// State object persists outside component
const s_element = elements.s_element_for(ancestry, T_Hit_Target.widget, '');
// State survives component recreation ✅
s_element.autorepeat_event = event;  // Persists across recreation
```

## Why State Objects?

### 1. **Survival Across Component Recreation**

State objects (`S_Element`, `S_Widget`, `S_Hit_Target`) live outside the component tree in manager dictionaries. When Svelte destroys a component:

```typescript
// Elements.ts manages state objects independently
private s_widget_dict_byAncestryID: Dictionary<S_Widget> = {};

s_widget_forAncestry(ancestry: Ancestry): S_Widget {
    const id = ancestry.id;
    return this.assure_forKey_inDict(id, this.s_widget_dict_byAncestryID, () => 
        new S_Widget(ancestry)
    );
}
```

The state object persists, and when the component recreates, it retrieves the same instance:

```svelte
<!-- Widget.svelte -->
<script>
    const s_widget = elements.s_widget_forAncestry(ancestry);
    // Same instance even if component was destroyed and recreated ✅
</script>
```

### 2. **Single Source of Truth for Computed Properties**

State objects centralize computation of derived values (colors, styles, borders) in getters:

```typescript
// S_Element.ts
get fill(): string {
    if (this.asTransparent) return 'transparent';
    if (this.isADot) return this.dotColors_forElement.fill;
    // ... complex logic centralized here ...
}

get stroke(): string {
    // ... single source of truth for stroke color ...
}
```

Components simply read these getters reactively — no duplication, no inconsistency.

### 3. **Cross-Component State Coordination**

Related components share state objects, enabling coordination:

```typescript
// S_Widget.ts
export default class S_Widget extends S_Element {
    s_reveal: S_Element;   // Shared state for reveal dot
    s_title: S_Element;    // Shared state for title
    s_drag: S_Element;     // Shared state for drag dot
}
```

When the widget is grabbed, all related dots update automatically because they read from shared state.

### 4. **Manager Access Without Component Context**

Managers can access and update state without needing component instances:

```typescript
// Hits.ts — can update hover state directly
set_asHovering(match: S_Hit_Target | null) {
    this.w_s_hover.set(match);  // Updates store, components react
}

// Components don't need to be aware — they just read s_element.isHovering
```

### 5. **State Snapshots for Computation**

State objects enable snapshotting for complex computations:

```typescript
// S_Snapshot.ts — captures state at a moment in time
export default class S_Snapshot {
    constructor(s_element: S_Element) {
        this.isHovering = s_element.isHovering;
        this.isGrabbed = s_element.ancestry.isGrabbed;
        this.isEditing = s_element.ancestry.isEditing;
        // ... immutable snapshot for color computation ...
    }
}

// Styles.ts — uses snapshot to compute colors
get_widgetColors_for(snapshot: S_Snapshot, thing_color: string, background_color: string) {
    // Computes colors from immutable snapshot
}
```

## Current State Object Hierarchy

```
S_Hit_Target (base class)
├── S_Element (visual properties: stroke, fill, cursor, border)
│   └── S_Widget (widget-specific state, contains s_reveal, s_title, s_drag)
├── S_Component (signal management, component lifecycle)
├── S_Rotation (ring rotation interaction)
└── S_Resizing (ring resize interaction)
```

## Alternatives Available Off-the-Shelf

### 1. **Svelte Stores Only** ❌ Insufficient

**Why it doesn't work:**
- Stores track values, not objects with methods
- No getters for computed properties
- No inheritance/polymorphism
- No methods for complex state logic
- Still need objects to hold related properties together

**Example limitation:**
```typescript
// Would need many stores per element
const w_isHovering = writable(false);
const w_isGrabbed = writable(false);
const w_fill = writable('white');
const w_stroke = writable('black');
// ❌ No getters, no computed properties, no methods
```

### 2. **Pinia** (State Management Library)

**What it is:** Vue's official state management library, but works with Svelte via adapter.

**Pros:**
- ✅ Persists across component recreation (stores are singletons)
- ✅ Supports getters (computed values)
- ✅ TypeScript support
- ✅ DevTools integration

**Cons:**
- ❌ Adds external dependency (~15KB)
- ❌ Designed for Vue ecosystem (adapter required)
- ❌ More abstraction than needed for this use case
- ❌ Store-centric model doesn't match our object-centric needs

**When to consider:** If migrating to Vue or building a multi-framework application.

### 3. **Zustand** (Lightweight State Management)

**What it is:** Minimal state management library, framework-agnostic.

**Pros:**
- ✅ Very lightweight (~1KB)
- ✅ Works with Svelte
- ✅ Simple API
- ✅ Persists across component recreation

**Cons:**
- ❌ Still store-based, not object-based
- ❌ Would need to wrap state objects in stores
- ❌ Adds external dependency
- ❌ Doesn't solve the core problem (need objects, not just stores)

**When to consider:** If building a new application from scratch and prefer store-based architecture.

### 4. **Svelte Context API**

**What it is:** Built-in Svelte feature for sharing state across component tree.

**Pros:**
- ✅ No external dependency
- ✅ Built into Svelte
- ✅ Simple for parent-child sharing

**Cons:**
- ❌ **Tied to component tree** — destroyed when context provider is destroyed
- ❌ Doesn't solve component recreation problem
- ❌ No access outside component tree (managers can't access)
- ❌ Doesn't provide object methods/getters

**When to consider:** For sharing simple values within a stable component subtree.

### 5. **Class Instances in Module Scope** (Our Approach)

**What it is:** Class instances managed outside component tree — what we're currently using.

**Pros:**
- ✅ Objects with methods, getters, inheritance (what we need)
- ✅ No external dependencies
- ✅ Full TypeScript support
- ✅ Direct manager access
- ✅ Survives component recreation
- ✅ Type-safe and maintainable

**Cons:**
- ❌ Requires manual lifecycle management (cleanup on unmount)
- ❌ Not reactive by itself (need stores for reactivity)
- ❌ More complex than standard Svelte patterns
- ❌ Not idiomatic Svelte
- ❌ Not well-documented in community

**Why we use this:** It fits our specific needs (frequent recreation, complex state coordination, object methods/getters), but it's **not optimal for most applications**. Standard Svelte patterns are simpler and better for most use cases.

**We combine it with Svelte stores for reactivity:**

```typescript
// State object (persistent, has methods/getters)
class S_Element {
    get fill(): string { /* computed */ }
}

// Store (reactive)
const w_s_hover = writable<S_Hit_Target | null>(null);

// Component reads both
$: fill_color = s_element.fill;  // Getter
$: isHovering = s_element.isEqualTo($w_s_hover);  // Store
```

### 6. **Redux/Flux Pattern**

**What it is:** Unidirectional data flow with centralized store.

**Pros:**
- ✅ Predictable state updates
- ✅ Time-travel debugging
- ✅ Well-documented pattern

**Cons:**
- ❌ Very heavy abstraction for this use case
- ❌ Immutable updates (we need mutable objects with getters)
- ❌ Action/reducer boilerplate
- ❌ Not object-oriented (we need classes with methods)

**When to consider:** For very large applications with complex state update requirements.

### 7. **MobX** (Reactive State Management)

**What it is:** Observable state management library.

**Pros:**
- ✅ Observable objects (automatic reactivity)
- ✅ Works with TypeScript
- ✅ Survives component recreation

**Cons:**
- ❌ Adds external dependency (~50KB)
- ❌ Requires decorators/configuration
- ❌ Overkill for our needs
- ❌ Learning curve for team

**When to consider:** If automatic reactivity on object properties is critical and team is familiar with MobX.

## Why Our Approach (And Why It's Not Widely Documented)

**Important caveat:** This pattern is **not widely documented in the Svelte community** because **most Svelte applications don't need it**. The standard Svelte patterns (stores, context, props) work well for 95% of use cases.

Our hybrid approach exists to solve **specific edge cases** in a complex, highly interactive application:

1. **State Objects** (persistent, methods, getters, inheritance)
   - `S_Element`, `S_Widget`, `S_Hit_Target`
   - Live in manager dictionaries
   - Survive component recreation
   - Provide computed properties via getters

2. **Svelte Stores** (reactivity)
   - `w_s_hover`, `w_ancestry_focus`
   - Trigger component updates
   - Simple, built-in reactivity

3. **Managers** (coordination)
   - `Elements`, `Hits`, `Styles`
   - Own and manage state objects
   - Provide factory methods
   - Handle lifecycle

**Example:**
```typescript
// Manager owns state object
const s_widget = elements.s_widget_forAncestry(ancestry);

// Component uses both
<script>
    const s_widget = elements.s_widget_forAncestry(ancestry);
    
    // Reactive to store
    $: isHovering = s_widget.isEqualTo($hits.w_s_hover);
    
    // Computed from state object
    $: fill_color = s_widget.fill;  // Calls getter
    $: stroke_color = s_widget.stroke;  // Calls getter
</script>

<div style="background: {fill_color}; border-color: {stroke_color}">
```

### Why Not Widely Documented?

This pattern isn't in Svelte docs/literature because:

1. **Most apps don't need it** — Standard Svelte patterns (stores, context, props) work for most use cases
2. **It's a workaround** — We're working around Svelte's component lifecycle for specific edge cases
3. **Adds complexity** — Requires managers, dictionaries, factory methods — more than most apps need
4. **Not idiomatic Svelte** — Goes against Svelte's philosophy of simple, component-local state
5. **Niche use case** — Only needed when you have:
   - Frequent component recreation
   - Complex cross-component state coordination
   - Need for object methods/getters alongside reactivity
   - Managers that need direct state access outside component tree

### When Standard Svelte Patterns Are Better

**For most applications, prefer:**

1. **Component-local state** — `let` variables for component-scoped state
2. **Svelte stores** — For shared reactive state
3. **Context API** — For sharing within component tree
4. **Props** — For parent-child communication

**Example of standard approach:**
```typescript
// ✅ Standard Svelte - works for most cases
let count = 0;  // Component-local
const countStore = writable(0);  // Shared reactive state

function increment() {
    count++;
    countStore.update(n => n + 1);
}
```

### When Our Pattern Makes Sense

**Consider this pattern when you have:**

1. **Components that frequently recreate** — Selection changes trigger component destruction/recreation
2. **State must survive recreation** — UI state (hover, grab, edit) persists across component lifecycle
3. **Complex object-oriented state** — Need classes with methods, getters, inheritance, not just values
4. **Managers need direct access** — Systems like `Hits` need to update state outside component context
5. **Cross-component coordination** — Related components (widget + dots) share complex state

### Trade-offs

**Pros:**
- ✅ State survives component recreation
- ✅ Object-oriented structure (methods, getters, inheritance)
- ✅ Managers can access state directly
- ✅ Centralized computation (getters)
- ✅ Type-safe with TypeScript

**Cons:**
- ❌ More complex than standard Svelte patterns
- ❌ Requires manual lifecycle management
- ❌ Not idiomatic Svelte (goes against framework philosophy)
- ❌ Learning curve for developers familiar with standard Svelte
- ❌ Not well-documented in community (because most don't need it)

## Key Insights

1. **This is a niche pattern** — Most Svelte apps should use standard patterns (stores, context, props)
2. **It solves specific problems** — Component recreation + complex state coordination
3. **Not optimal for everyone** — Adds complexity that most apps don't need
4. **Hybrid approach** — State objects for structure, stores for reactivity
5. **Consider alternatives first** — Try standard Svelte patterns before adopting this approach

## Related Documents

- [writables.md](./writables.md) - Analysis of store organization patterns
- [hits.md](./hits.md) - How `S_Hit_Target` enables centralized hit testing
- [styles.md](./styles.md) - How state objects enable centralized color computation

