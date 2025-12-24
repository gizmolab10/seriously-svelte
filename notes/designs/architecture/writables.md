# State Management Analysis & Refactoring

## Overview

This document analyzes the state management architecture in the application and documents two orthogonal refactoring approaches:

1. **Organizational Refactoring**: Converting module-level stores to class-based state management
2. **Functional Refactoring**: Converting writable stores to derived stores where values can be computed

These refactorings address different dimensions and can be applied independently or together.

---

## Part I: Design - Understanding Store Refactoring

### Two Types of Refactoring

#### Organizational Refactoring (Where Stores Live)

**Purpose**: Convert global module-level stores into class-based state management

**What It Addresses**:
- **Where stores live**: Module-level exports → Class properties
- **How stores are organized**: Global namespace → Encapsulated in class instance
- **Access pattern**: Direct imports → Object property access

**Transformation**:
```typescript
// BEFORE
export const w_count_rebuild = writable<number>(0);
export const w_ancestry_focus = writable<Ancestry>();

// AFTER
export class State {
    w_count_rebuild = writable<number>(0);
    w_ancestry_focus = writable<Ancestry>();
}
export const state = new State();
```

**Key Changes**:
- Import pattern: `import { w_store }` → `import { state }` then `state.w_store`
- Usage: `w_store.set()` → `state.w_store.set()`
- **Store type remains the same**: Still `writable()` stores

**Benefits**:
- Better encapsulation
- Easier testing (can create multiple instances)
- Consistent with existing `Colors.ts` pattern
- Initialization control via class methods

#### Functional Refactoring (What Type of Store)

**Purpose**: Convert writable stores to derived stores where values can be computed

**What It Addresses**:
- **What type of store**: `writable()` → `derived()`
- **How values are computed**: Manual `set()` calls → Automatic computation from dependencies
- **Store behavior**: Writable/read-write → Read-only/computed

**Transformation**:
```typescript
// BEFORE
w_item = writable<T | null>(null);
set index(i: number) {
    this.w_index.set(i);
    this.w_item.set(this.items[i] ?? null);  // Manual sync
}

// AFTER
w_item!: Readable<T | null>;
constructor() {
    this.w_item = derived(
        [this.w_items, this.w_index],
        ([items, index]) => items[index] ?? null  // Automatic sync
    );
}
```

**Key Changes**:
- Store type: `writable<T>()` → `Readable<T>` (via `derived()`)
- Synchronization: Manual `set()` calls → Automatic updates
- **Where stores live**: Unchanged (can be module-level or class property)

**Benefits**:
- Automatic synchronization (no manual `set()` calls)
- Simplified code (removed sync logic)
- Type safety (read-only prevents accidental writes)
- Always correct (computed from source of truth)

### Relationship Between Refactorings

These refactorings address **orthogonal concerns**:

| Dimension | Organizational | Functional |
|-----------|----------------|------------|
| **Scope** | Where stores live | What type of store |
| **Question** | "Where should stores live?" | "What type of store should this be?" |
| **Changes** | Import/access patterns | Store type and computation |
| **Impact** | All stores (50+ files) | Only derivable stores (fewer files) |

**Can Be Combined**: A store can undergo both refactorings:
```typescript
// Original: Module-level writable
export const w_item = writable<T | null>(null);

// After organizational: Class property writable
export class State {
    w_item = writable<T | null>(null);
}

// After functional: Class property derived
export class State {
    w_item!: Readable<T | null>;
    constructor() {
        this.w_item = derived(...);
    }
}
```

---

## Part II: Design - Current State Analysis

### State.ts Analysis

**File**: `src/lib/ts/state/State.ts`

**Purpose**: Centralized state management module for Svelte application

#### Structure
- Uses unique symbols as visual dividers to organize stores into categories
- Naming convention: `w_` prefix for writable stores
- All stores are strongly typed with TypeScript

#### Store Categories

**1. Thing-Related Stores**
- `w_relationship_order`: Track relationship ordering
- `w_thing_fontFamily`: Font family for things
- `w_thing_title`: Current thing title (nullable)
- `w_s_alteration`: Alteration state object (nullable)
- `w_s_title_edit`: Title editing state (nullable, defaults to null)

**2. Ancestry/Hierarchy Stores**
- `w_hierarchy`: Main hierarchy manager instance
- `w_ancestry_focus`: Currently focused ancestry (now derived in UX.ts)
- `w_ancestry_forDetails`: Ancestry for detail display (now derived in UX.ts)

**3. Counter Stores**
- `w_count_window_resized`: Tracks window resize events
- `w_count_mouse_up`: Tracks mouse up events
- `w_count_rebuild`: Tracks rebuild operations
- `w_count_details`: Tracks detail view changes

**4. Miscellaneous Stores**
- `w_t_startup`: Application startup state
- `w_auto_adjust_graph`: Auto-adjustment settings
- `w_s_hover`: Currently hovered element
- `w_popupView_id`: Active popup view ID
- `w_dragging_active`: Dragging state
- `w_control_key_down`: Control key state
- `w_device_isMobile`: Mobile device detection
- `w_font_size`: Font size setting

#### Strengths
- Clear organization using symbol separators
- Consistent naming convention
- Strong typing throughout
- Appropriate use of nullable types

#### Potential Issues
1. **Missing initial values**: Most stores lack default values
2. **Global state**: All stores are module-level globals (may complicate testing)
3. **No derived stores**: No computed/derived stores present (addressed in functional refactoring)
4. **Symbol values unused**: Symbols serve only as visual markers

#### Usage Pattern
Global state registry where components import individual stores as needed. Counter-based stores use increment pattern to trigger reactive updates.

### Colors.ts Pattern Analysis

**File**: `src/lib/ts/managers/Colors.ts`

**Purpose**: Example of class-based state management with writable stores as properties

#### Class Structure

**Mixed properties**:
- Regular properties: `default`, `banner`, `border`, `background`, etc.
- **Writable store properties**:
  - `w_background_color = writable<string>()`
  - `w_thing_color = writable<string | null>(null)`
  - `w_separator_color = writable<string>(this.separator)`

**Singleton instance**:
```typescript
export const colors = new Colors();
```
- Single instance exported for app-wide access
- Stores accessed as `colors.w_background_color`

**Initialization pattern**:
- Some stores have default values from class properties
- `restore_preferences()` method sets values and creates subscriptions
- Stores can reference other class properties (`this.separator`)

#### Usage Patterns

**TypeScript files** (4 files total):
```typescript
import { colors } from '../managers/Colors';
import { get } from 'svelte/store';

// Reading
const color = get(colors.w_background_color);

// Writing
colors.w_background_color.set('white');
```

**Svelte components** (0 files):
- No Svelte components directly access `colors.w_*` stores
- Clean separation: stores used programmatically, not reactively in UI

### Impact Assessment

**Files importing from State.ts**:
- **20 TypeScript files**
- **30 Svelte components**
- **Total: 50 files** will need updates for organizational refactoring

#### Current Usage Patterns

**TypeScript files**:
```typescript
import { w_count_rebuild, w_ancestry_focus } from '../state/State';
import { get } from 'svelte/store';

// Reading
const value = get(w_count_rebuild);

// Writing
w_count_rebuild.set(value);
w_count_rebuild.update(n => n + 1);
```

**Svelte components**:
```typescript
import { w_s_hover, w_ancestry_focus } from '../../ts/state/State';

// Reactive access with $
$w_s_hover
$w_ancestry_focus
```

#### Key Difference from Colors Pattern

**Critical finding**: Unlike `colors.w_*` pattern, State.ts stores are:
- Imported directly as named exports
- Used standalone, not through an object reference
- Accessed reactively in Svelte with `$` prefix

This means the migration will require:
1. Converting imports from destructured exports to object property access
2. In Svelte components: import state, then destructure properties to enable `$` reactivity
3. Changing `get(w_store)` to `get(state.w_store)` in TypeScript

---

## Part III: Design - Store Inventory

### Derivable Stores Analysis

Most writable stores cannot be derived because they represent:
- User preferences/settings (persisted and manually set)
- Edit state (manually controlled)
- Event counters (incrementally updated)
- UI state (user interactions)
- System state (initialization, database state)

### S_Items.ts Stores

#### Converted to Derived Stores ✅

**1. `w_item`** - ✅ **CONVERTED TO DERIVED**
- **Type**: `Readable<T | null>` (was `writable<T | null>(null)`)
- **Purpose**: Current item at the current index
- **Implementation**: Derived from `w_items` and `w_index`
- **Derivation**: `items[index] ?? null`
- **Status**: ✅ Implemented - automatically updates when items or index change

**2. `w_length`** - ✅ **CONVERTED TO DERIVED**
- **Type**: `Readable<number>` (was `writable<number>(0)`)
- **Purpose**: Length of the items array
- **Implementation**: Derived from `w_items`
- **Derivation**: `items.length`
- **Status**: ✅ Implemented - automatically updates when items change

**3. `w_extra_titles`** - ✅ **CONVERTED TO DERIVED**
- **Type**: `Readable<string[]>` (was `writable<string[]>([])`)
- **Purpose**: Extra navigation titles (previous/next)
- **Implementation**: Derived from `w_length` (which is derived from `w_items`)
- **Derivation**: `length < 2 ? [] : [T_Direction.previous, T_Direction.next]`
- **Status**: ✅ Implemented - demonstrates derived store chaining

**4. `w_description`** - ✅ **CONVERTED TO DERIVED**
- **Type**: `Readable<string>` (was `writable<string>('')`)
- **Purpose**: Description string for debugging/logging
- **Implementation**: Derived from `w_items` and `w_index`
- **Derivation**: Complex string formatting: `id (@ ${index}): ${identifiable?.id}   ids (${length}): ${descriptionBy_sorted_IDs}`
- **Status**: ✅ Implemented - automatically updates when items or index change

#### Remaining Writable Stores in S_Items

- `w_items` - Source of truth (cannot be derived)
- `w_index` - User/system selection (cannot be derived)

### UX.ts Stores

#### Cannot Be Derived ❌

**`w_s_title_edit`**
- **Type**: `writable<S_Title_Edit | null>(null)`
- **Purpose**: Tracks which ancestry is currently being edited
- **Why not derivable**: Set manually when editing starts/stops. Represents edit state, not computed state.

**`w_s_alteration`**
- **Type**: `writable<S_Alteration | null>()`
- **Purpose**: Tracks current alteration operation state
- **Why not derivable**: Set manually when alteration operations begin/end. Represents operation state.

**`w_thing_title`**
- **Type**: `writable<string | null>()`
- **Purpose**: Current thing title being edited
- **Set in**: `Widget_Title.svelte` during editing, `Preferences.restore_preferences()` from saved preferences
- **Why not derivable**: Set manually during editing. Used as a trigger for reactivity but not derived from `w_ancestry_forDetails?.thing?.title` because it's set independently when editing.

**`w_relationship_order`**
- **Type**: `writable<number>(0)`
- **Purpose**: Timestamp that increments when relationship orders change (used as reactivity trigger)
- **Set in**: `Relationship.ts` when orders change
- **Why not derivable**: Used as a reactivity trigger/counter. Not computed from other state.

**`w_thing_fontFamily`**
- **Type**: `writable<string>()`
- **Purpose**: Font family preference for things
- **Set in**: `Preferences.restore_preferences()` from saved preferences
- **Why not derivable**: User preference persisted to database. Set manually, not computed.

### Other Managers - All Cannot Derive ❌

**Visibility.ts**: User preferences and UI state
- `w_t_cluster_pager`, `w_t_breadcrumbs`, `w_t_auto_adjust_graph`, `w_t_graph`, `w_t_details`, `w_t_countDots`, `w_t_trees`, `w_id_popupView`, `w_show_*` stores

**Search.ts**: Search state and preferences
- `w_search_results_found`, `w_search_results_changed`, `w_s_search`, `w_search_preferences`

**Events.ts**: Event counters and interaction state
- `w_count_*` stores, `w_control_key_down`, `w_mouse_*` stores

**Geometry.ts**: UI state and user preferences
- `w_depth_limit`, `w_branches_areChildren`, `w_user_graph_*`, `w_rect_ofGraphView`, `w_scale_factor`

**Radial.ts**: Graphics/rendering state
- `w_rotate_angle`, `w_g_paging`, `w_g_cluster`, `w_resize_radius`

**Stores.ts**: System state
- `w_t_startup`, `w_hierarchy`

**Databases.ts**: Database state
- `w_data_updated`, `w_t_database`

**Hits.ts**: Interaction state
- `w_s_hover`, `w_longClick`, `w_autorepeat`, `w_dragging`

**Colors.ts**: User preferences
- `w_background_color`, `w_thing_color`, `w_separator_color`

**Configuration.ts**: System configuration
- `w_device_isMobile`

---

## Part IV: Action - Organizational Refactoring Implementation

### Migration Strategy

#### Pattern to Follow

**Transform State.ts from**:
```typescript
export const w_count_rebuild = writable<number>(0);
export const w_ancestry_focus = writable<Ancestry>();
```

**To**:
```typescript
export class State {
    w_count_rebuild = writable<number>(0);
    w_ancestry_focus = writable<Ancestry>();

    // Optional: initialization method like Colors.restore_preferences()
    initialize() {
        // Set up subscriptions, defaults, etc.
    }
}

export const state = new State();
```

### Migration Steps (Per Store)

**1. Update State.ts**
- Move one store from module-level to class property
- Keep both exports temporarily for gradual migration

**2. Update TypeScript files** (~20 files)
```diff
- import { w_count_rebuild } from '../state/State';
+ import { state, w_count_rebuild } from '../state/State';

- get(w_count_rebuild)
+ get(state.w_count_rebuild)

- w_count_rebuild.set(value)
+ state.w_count_rebuild.set(value)
```
Note: Keep old export temporarily during migration. Combine state with other State imports on same line.

**3. Update Svelte files** (~30 files)
```diff
- import { w_count_rebuild } from '../../ts/state/State';
+ import { state, w_count_rebuild } from '../../ts/state/State';
+ const { w_count_rebuild } = state;

  $w_count_rebuild
```
Note: Combine state with other State imports on same line. In Svelte, you cannot use `$state.w_count_rebuild` for reactivity. You must destructure first with `const { w_count_rebuild } = state;` then use `$w_count_rebuild`.

**4. Remove old export**
- After all files updated, remove module-level export

### Recommended Order

Start with stores that have:
1. **Fewest dependencies** (simplest to migrate)
2. **Clear initialization needs** (benefit from class methods)
3. **Simple types** (fewer edge cases)

**Suggested first candidate**: `w_count_rebuild`
- Simple number type
- Clear default value (0)
- Used in only a few files
- Counter pattern is straightforward

### Benefits

1. **Better encapsulation**: State lives in a class, not global scope
2. **Easier testing**: Can create State instances for tests
3. **Initialization control**: Class constructor or init method
4. **Type safety**: Single import point reduces errors
5. **Consistent pattern**: Matches existing Colors.ts pattern

### Risks & Mitigations

**Risk**: Breaking reactivity in Svelte
- **Mitigation**: Test each migration thoroughly; stores remain writable stores

**Risk**: Missing usage locations
- **Mitigation**: Use TypeScript compiler to find all errors after change

**Risk**: Circular dependencies
- **Mitigation**: Start with low-dependency stores first

---

## Part V: Action - Functional Refactoring Implementation

### Current Implementation Status

All recommended conversions have been completed. The `S_Items` class now has **4 derived stores** that automatically stay in sync with their dependencies.

### Implementation Approach

The derived stores are initialized in a `setup()` method called from the constructor:

```typescript
constructor(items: Array<T>) {
    this.setup();  // Initialize all derived stores
    this.items = items;  // Then set items (triggers derived store updates)
}

private setup() {
    // Initialize derived stores in dependency order
    this.w_length = derived(this.w_items, (items) => items.length);
    this.w_extra_titles = derived(this.w_length, (length) => 
        (length < 2) ? [] : [T_Direction.previous, T_Direction.next]
    );
    this.w_item = derived(
        [this.w_items, this.w_index],
        ([items, index]) => items[index] ?? null
    );
    this.w_description = derived(
        [this.w_items, this.w_index],
        ([items, index]) => {
            const item = items[index] ?? null;
            const identifiable = item as unknown as Identifiable ?? null;
            const descriptionBy_sorted_IDs = items.map(item => 
                (item as unknown as Identifiable)?.id ?? ''
            ).sort().join('|');
            return `id (@ ${index}): ${identifiable?.id ?? ''}   ids (${items.length}): ${descriptionBy_sorted_IDs}`;
        }
    );
}
```

### Benefits Achieved

- **Automatic synchronization**: No manual `set()` calls needed
- **Simplified code**: Removed all manual synchronization logic
- **Type safety**: Read-only stores prevent accidental writes
- **Correctness**: Stores always reflect current state
- **Derived store chain**: `w_items` → `w_length` → `w_extra_titles` demonstrates efficient chaining

### Implementation Notes

**S_Items Constructor Solution**: The derived stores are initialized in a `setup()` method to avoid the chicken-and-egg problem. This ensures all derived stores are ready before `w_items` is set, allowing them to react to the initial value.

---

## Part VI: Action - Tasks & Status

### Organizational Refactoring Tasks

- [x] Analyze `src/lib/ts/state/State.ts`
- [x] Propose a strategy for converting the global writable stores into properties of a class called State
  - [x] Assess how many files will need to be changed
  - [x] Analyze how `ts/Colors.ts` has some writable store properties
    - [x] Analyze how other ts files access `colors.w_*`
    - [x] Analyze how svelte components access them
- [ ] Begin with exactly one of the global writable stores and move it into State and properly update all files that use it

### Functional Refactoring Status

- [x] Analysis complete: Identified all candidates
- [x] Implementation complete: All 4 `S_Items` stores converted
  - ✅ `w_item`
  - ✅ `w_length`
  - ✅ `w_description`
  - ✅ `w_extra_titles`

### Current State Summary

| Refactoring Type | Status | Impact |
|------------------|--------|--------|
| **Organizational** | Analysis done, implementation pending | 50+ files |
| **Functional** | ✅ Complete for `S_Items` | Fewer files, but critical stores |

---

## Notes

- Project recently renamed "Stores" to "State" (commit: 4a12198)
- Recent refactoring includes radial view stores, color stores, database writable stores, and search stores
- `w_ancestry_focus` and `w_ancestry_forDetails` have been converted to derived stores in `UX.ts` (documented in `focus.md`)
