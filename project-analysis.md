# Project Analysis & Development Log

## Goals

- Analyze and refactor state management in seriously-svelte
- Document code structure and patterns
- Track improvements and changes

## Strategy

### Current Focus
- Understanding the state management architecture
- Analyzing State.ts and related files
- Identifying patterns and potential improvements

## Tasks

- [x] Analyze `src/lib/ts/state/State.ts`
- [x] propose a strategy for converting the global writable stores into properties of a class called State
	- [x] assess how many files will need to be changed
	- [x] analyze how ts/Colors.ts has some writable store properties and (to understand how to properly update how the rest of the app needs to be updated):
		- [x] analyze how other ts files access colors.w_*
		- [x] analyze how svelte components access them
	- [ ] begin with exactly one of the global writable stores and move it into State and properly update all files that use it

## Analyses

### State.ts Analysis (2025-11-09)

**File:** `src/lib/ts/state/State.ts`

**Purpose:** Centralized state management module for Svelte application

#### Structure
- Uses unique symbols as visual dividers to organize stores into categories
- Naming convention: `w_` prefix for writable stores
- All stores are strongly typed with TypeScript

#### Store Categories

**1. Thing-Related Stores (lines 11-15)**
- `w_relationship_order`: Track relationship ordering
- `w_thing_fontFamily`: Font family for things
- `w_thing_title`: Current thing title (nullable)
- `w_s_alteration`: Alteration state object (nullable)
- `w_s_title_edit`: Title editing state (nullable, defaults to null)

**2. Ancestry/Hierarchy Stores (lines 19-21)**
- `w_hierarchy`: Main hierarchy manager instance
- `w_ancestry_focus`: Currently focused ancestry
- `w_ancestry_forDetails`: Ancestry for detail display

**3. Counter Stores (lines 25-28)**
- `w_count_window_resized`: Tracks window resize events
- `w_count_mouse_up`: Tracks mouse up events
- `w_count_rebuild`: Tracks rebuild operations
- `w_count_details`: Tracks detail view changes

**4. Miscellaneous Stores (lines 32-39)**
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
3. **No derived stores**: No computed/derived stores present
4. **Symbol values unused**: Symbols serve only as visual markers

#### Usage Pattern
Global state registry where components import individual stores as needed. Counter-based stores use increment pattern to trigger reactive updates.

---

### Colors.ts Pattern Analysis (2025-11-09)

**File:** `src/lib/ts/managers/Colors.ts`

**Purpose:** Example of class-based state management with writable stores as properties

#### Class Structure

**Mixed properties** (lines 8-21):
- Regular properties: `default`, `banner`, `border`, `background`, etc.
- **Writable store properties**:
  - `w_background_color = writable<string>()`
  - `w_thing_color = writable<string | null>(null)`
  - `w_separator_color = writable<string>(this.separator)`

**Singleton instance** (line 399):
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

---

### Impact Assessment (2025-11-09)

**Files importing from State.ts:**
- **20 TypeScript files**
- **30 Svelte components**
- **Total: 50 files** will need updates

#### Current Usage Patterns

**TypeScript files:**
```typescript
import { w_count_rebuild, w_ancestry_focus } from '../state/State';
import { get } from 'svelte/store';

// Reading
const value = get(w_count_rebuild);

// Writing
w_count_rebuild.set(value);
w_count_rebuild.update(n => n + 1);
```

**Svelte components:**
```typescript
import { w_s_hover, w_ancestry_focus } from '../../ts/state/State';

// Reactive access with $
$w_s_hover
$w_ancestry_focus
```

#### Key Difference from Colors Pattern

**Critical finding:** Unlike `colors.w_*` pattern, State.ts stores are:
- Imported directly as named exports
- Used standalone, not through an object reference
- Accessed reactively in Svelte with `$` prefix

This means the migration will require:
1. Converting imports from destructured exports to object property access
2. In Svelte components: import state, then destructure properties to enable `$` reactivity
3. Changing `get(w_store)` to `get(state.w_store)` in TypeScript

---

### Migration Strategy

#### Pattern to Follow

**Transform State.ts from:**
```typescript
export const w_count_rebuild = writable<number>(0);
export const w_ancestry_focus = writable<Ancestry>();
```

**To:**
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

#### Migration Steps (Per Store)

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

#### Recommended Order

Start with stores that have:
1. **Fewest dependencies** (simplest to migrate)
2. **Clear initialization needs** (benefit from class methods)
3. **Simple types** (fewer edge cases)

**Suggested first candidate:** `w_count_rebuild`
- Simple number type
- Clear default value (0)
- Used in only a few files
- Counter pattern is straightforward

#### Benefits

1. **Better encapsulation**: State lives in a class, not global scope
2. **Easier testing**: Can create State instances for tests
3. **Initialization control**: Class constructor or init method
4. **Type safety**: Single import point reduces errors
5. **Consistent pattern**: Matches existing Colors.ts pattern

#### Risks & Mitigations

**Risk:** Breaking reactivity in Svelte
- **Mitigation:** Test each migration thoroughly; stores remain writable stores

**Risk:** Missing usage locations
- **Mitigation:** Use TypeScript compiler to find all errors after change

**Risk:** Circular dependencies
- **Mitigation:** Start with low-dependency stores first

---

## Notes

- Project recently renamed "Stores" to "State" (commit: 4a12198)
- Recent refactoring includes radial view stores, color stores, database writable stores, and search stores
