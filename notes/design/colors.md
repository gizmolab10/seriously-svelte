# Color Management

## Overview

Centralized color management system driven by the Hits manager and hit targets. Colors are computed based on component type, state (hover/selected/none), and interaction context.

## Core Components

- **widget** - Main widget container
- **drag** - Drag handle dot
- **reveal** - Reveal/expand dot
- **button** - UI buttons

## States

- **hover** - Mouse is over the element
- **selected** - grab
- **editing** - 
- **focus** - 
- **mouse down** - 
- **none** - Default/base state



## Driver

- **Hits Manager** (`Hits.ts`) - Tracks hover state via `w_s_hover` store
- **Hit Target** (`S_Hit_Target`) - Base class for all interactive elements, provides hover state

## Color Properties

### Per Component
- `fill` - Background/fill color
- `stroke` - Border/text color
- `svg_outline_color` - SVG outline color
- `border` - CSS border style

### State Logic
- Hover state from `hits.w_s_hover`
- Selected state from `isSelected`
- Inversion logic via `isInverted` and `color_isInverted`

## Architecture

### Current Implementation ✅
- Colors computed centrally in `Styles` utility class
- `S_Element` and `S_Widget` getters call `Styles` methods
- Components remain reactive via getter pattern
- `set_forHovering()` sets hover color and cursor (unchanged)

### Implementation Status
- [x] Define color schema per component/state
- [x] Centralize color computation logic
- [x] Create `S_Color` state object class
- [x] Migrate widget, drag, reveal, button components
- [ ] Standardize state transitions
- [ ] Document color inheritance rules

## Define color schema per component/state

### Common Fill/Stroke Pattern (Drag, Reveal, Button)

**Base setup:**
- `element_color` - Set via `set_forHovering(thing.color, cursor)`
- `hoverColor` - Computed via `colors.hover_special_blend(element_color)`
- `color_background` - From `w_background_color`

**Fill/Stroke computation (all states except selected/disabled):**
- `fill`: `color_isInverted ? hoverColor : color_background`
- `stroke`: `color_isInverted ? color_background : element_color`

### Dots (Drag, Reveal)

**Properties:**
- `fill`, `stroke` - Use common pattern above
- `svg_outline_color` - SVG path outline

**States:**
- **none/hover**: `svg_outline_color` = `thing_color`
- **grabbed**: `svg_outline_color` = `color_background`
- **editing**: `svg_outline_color` = `black` (if light thing_color) or `hoverColor` (if dark)

**Special:**
- Drag: `parents_color` = `stroke`, `related_color` = `thing.color`
- Reveal: `bulkAlias_color` = `stroke`

### Widget

**Properties:**
- `color` - Text/stroke (via `colorFor_grabbed_andEditing()`)
- `background_color` - Background fill
- `border` - CSS border style

**States:**
- **none**: `color` = `thing_color`, `background_color` = `transparent`, `border` = `transparent`
- **hover**: `background_color` = `w_background_color`, `border` = `solid ${colors.ofBackgroundFor(thing_color)} 1px`
- **grabbed**: `color` = `black`/`white` (based on thing_color luminance), `background_color` = `thing_color`
- **editing**: `background_color` = `w_background_color`, `border` = `dashed ${thing_color} 1px`
- **focus** (radial): `background_color` = `w_background_color`, `border` = `solid ${thing_color} 1px`

### Button

**Properties:**
- `fill`, `stroke` - Use common pattern above
- `border` - CSS border style

**Special states:**
- **selected**: `fill` = `lightblue`
- **disabled**: `fill` = `transparent`, `stroke` = `disabledTextColor`
- **editing/focus**: `border` uses `thing_color` (widget context only)

## Centralize color computation logic

### Design Summary

**Current State:**
- Color logic scattered across `S_Element`, `S_Widget` getters
- Components call `update_colors()` reactively with local variables
- Duplication of fill/stroke inversion logic
- State combinations computed inline

**Implemented Architecture:**

Created `Styles` utility class (`src/lib/ts/utilities/Styles.ts`) with static methods:
- Takes inputs: `S_Color` state object, base colors
- Returns computed color values based on schema
- Encapsulates all conditional logic in one place
- Supports all component types (widget, drag, reveal, button)

**Implementation Details:**

1. **Single computation function per component type** ✅
   - `Styles.computeWidgetColors(state, thing_color, background_color)` → `{ color, background_color, border }`
   - `Styles.computeDotColors(state, element_color, thing_color, background_color, hoverColor)` → `{ fill, stroke, svg_outline_color }`
   - `Styles.computeButtonColors(state, element_color, background_color, hoverColor, disabledTextColor, border_thickness, has_widget_context, thing_color)` → `{ fill, stroke, border }`

2. **State object pattern** ✅
   - `S_Color` class (`src/lib/ts/state/S_Color.ts`) encapsulates all state flags
   - Constructor accepts `S_Hit_Target | Identifiable | undefined` plus optional flags
   - Getters provide: `hover`, `grabbed`, `editing`, `focus`, `thing_color`
   - Special hover logic: for widgets, also checks if title with same ancestry is hovered

3. **Getters are thin wrappers** ✅
   - `S_Element`/`S_Widget` getters create `S_Color` instance and call `Styles` methods
   - Components remain reactive via getter pattern
   - Logic centralized in `Styles`, state collected in `S_Color`

4. **Preserve reactive behavior** ✅
   - Getters still reactive - Svelte tracks dependencies
   - No changes to component reactive blocks needed
   - All color logic testable in isolation

**Benefits:**
- Single source of truth for color computation
- Easier to modify color behavior globally
- Testable in isolation
- Reduces code duplication
- Clearer separation of concerns

### Impact on State Objects

**S_Hit_Target (base class):**
- **Keep**: `hoverColor`, `element_color`, `set_forHovering()` - these provide inputs to ColorComputer
- **Keep**: `isHovering` getter - needed for state collection
- **No change**: Hit testing and cursor logic remain here

**S_Element (Implemented):**
- **Kept as inputs**: `color_background`, `isDisabled`, `isSelected`, `isInverted`, `subtype`
- **Getters now call Styles**: `fill`, `stroke`, `svg_outline_color`, `border` create `S_Color` and call `Styles.computeDotColors()` or `Styles.computeButtonColors()`
- **Helper getters**: `s_color`, `thing_color`, `dotColors_forElement`, `buttonColors_forElement` reduce duplication
- **Removed**: Old inline color logic from getters
- **Actual implementation:**
  ```typescript
  get fill(): string {
    if (this.asTransparent) {
      return 'transparent';
    } else if (this.isADot) {
      return this.dotColors_forElement.fill;
    } else if (this.isAControl) {
      return this.buttonColors_forElement.fill;
    } else {
      return this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background;
    }
  }
  ```

**S_Widget (Implemented):**
- **Getters now call Styles**: `color`, `background_color`, `border` create `S_Color` and call `Styles.computeWidgetColors()`
- **Removed**: `colorFor_grabbed_andEditing()`, `isFilled`, `shows_border`, `isRadial_focus` helper methods
- **Actual implementation:**
  ```typescript
  get color(): string {
    const state = new S_Color(this, this.isDisabled, this.isSelected, this.isInverted, this.subtype);
    return Styles.computeWidgetColors(state, this.thing_color, get(colors.w_background_color)).color;
  }
  ```

**State Collection Pattern:**
- Each getter collects relevant state from `this`, `this.ancestry`, and stores
- Passes complete state object to ColorComputer
- ColorComputer handles all conditional logic
- State objects become data containers + thin computation wrappers

**S_Color State Object (Implemented):**

The `S_Color` class (`src/lib/ts/state/S_Color.ts`) encapsulates all state flags and context needed for color computation:

```typescript
export default class S_Color {
  hit_target?: S_Hit_Target;      // Hit target for hover detection (includes type + identifiable)
  identifiable?: Identifiable;     // Provides: isGrabbed, isEditing, isFocus, thing.color
  isInverted?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  subtype?: string;                // For special cases (e.g., T_Control.details)

  constructor(hit_target: S_Hit_Target | Identifiable | undefined, 
              isDisabled?: boolean, 
              isSelected?: boolean, 
              isInverted?: boolean, 
              subtype?: string)

  // Getters:
  get hover(): boolean             // Checks hit_target.isHovering or compares identifiable.id with hits.w_s_hover
  get grabbed(): boolean           // Returns ancestry?.isGrabbed ?? false
  get editing(): boolean           // Returns ancestry?.isEditing ?? false
  get focus(): boolean             // Returns ancestry?.isFocus ?? false
  get thing_color(): string        // Returns ancestry?.thing?.color ?? k.empty
}
```

**Key characteristics:**
- Constructor accepts `S_Hit_Target` or `Identifiable` - handles both patterns
- `hover` getter has special logic: for widgets, checks if title with same ancestry is hovered (fixes widget title hover bug)
- `grabbed`, `editing`, `focus`, `thing_color` safely accessed via `ancestry` getter (casts `identifiable` to `Ancestry`)
- State object is created fresh on each getter call (no caching needed due to Svelte reactivity)
- All properties are optional except those provided by getters

**Migration Completed:**
1. ✅ Implemented `Styles` utility class with static methods
2. ✅ Created `S_Color` state object class
3. ✅ Migrated widget, drag, reveal, button components
4. ✅ Removed deprecated helper methods (`colorFor_grabbed_andEditing`, `isFilled`, `shows_border`, `isRadial_focus`)
5. ✅ Fixed widget title hover bug (S_Color.hover checks for title/widget with same ancestry)

**Code Reduction:**
- Estimated ~200+ lines of duplicated color logic eliminated
- Centralized logic makes future changes easier
- All components now use same computation patterns

## Styles Utility Class (Implementation)

### Design Decision

**Current Pattern:**
Managers are singleton classes exported from `Global_Imports`:
- `Colors` manager - color scheme management, stores, utility functions
- `Hits` manager - hit testing, hover detection, click handling
- `UX` manager (exported as `x`) - grab/focus/expand state management
- Pattern: `export class ManagerName { ... }` then `export const instance = new ManagerName();`

**Pros of Manager Pattern:**

1. **Consistency with existing codebase**
   - Follows established architectural pattern
   - Integrates seamlessly with `Global_Imports`
   - Matches how other computation/state logic is organized

2. **Single instance, shared access**
   - One instance imported globally (e.g., `colorComputer.computeWidgetColors()`)
   - No need to pass instances around
   - Easy to access from any component

3. **Future extensibility**
   - Can add state/stores if needed (e.g., caching, computed color themes)
   - Can add lifecycle methods (initialization, cleanup)
   - Room to grow beyond pure computation

4. **Clear ownership**
   - Explicitly owns color computation domain
   - Clear separation from `Colors` manager (scheme/stores) vs ColorComputer (computation logic)

**Cons of Manager Pattern:**

1. **Overhead for pure functions**
   - ColorComputer is primarily pure computation (functions that take state → return colors)
   - Manager pattern adds class instantiation overhead
   - State objects (`S_Color`) already passed in - no need for manager to hold state

2. **Alternative: Static utility class**
   - Could be `export class ColorComputer { static computeWidgetColors(...) }`
   - No instance needed for pure functions
   - Simpler: `ColorComputer.computeWidgetColors()` vs `colorComputer.computeWidgetColors()`

3. **Separation from Colors manager**
   - `Colors` manager handles color schemes, stores, utility functions
   - ColorComputer handles computation logic
   - Might be confusing having two color-related managers
   - Could alternatively live as methods on existing `Colors` manager

4. **No state management needed**
   - Unlike `Hits` (manages stores, timers) or `UX` (manages S_Items), ColorComputer has no persistent state
   - Pure computation doesn't benefit from singleton instance
   - All state comes from `S_Color` parameter

**Implementation:**

Used **static utility class** approach:
- `export default class Styles { static computeWidgetColors(...), static computeDotColors(...), static computeButtonColors(...) }`
- Located in `src/lib/ts/utilities/Styles.ts`
- Pure computation functions - no instance state needed
- Easy to test and reason about
- Clear separation: `Styles` computes colors, `Colors` manager handles schemes/stores

**File Structure:**
- `src/lib/ts/utilities/Styles.ts` - Color computation logic
- `src/lib/ts/state/S_Color.ts` - State object for passing to Styles
- `src/lib/ts/state/S_Element.ts` - Uses Styles for dot/button colors
- `src/lib/ts/state/S_Widget.ts` - Uses Styles for widget colors

## Implementation Notes

- ✅ Colors respond to: hover, grab, edit, focus, selected, disabled
- ✅ Inversion logic: `color_isInverted = (isInverted ?? false) !== hover` (computed in Styles)
- ✅ Background color from `colors.w_background_color`
- ✅ Thing color from `ancestry.thing?.color` (accessed via `S_Color.thing_color` getter)
- ✅ Widget title hover: `S_Color.hover` checks if widget/title with same ancestry is hovered
- ✅ Deprecated code removed: `colorFor_grabbed_andEditing()`, `isRadial_focus`, unused `svg_outline_color` fallback logic
- ✅ Only widgets can have selected, editing or focus state (via ancestry)

## Known Issues / Future Work

- Glow buttons have some click handling issues (separate from color management)
- Consider adding tests for Styles computation functions
- Could further simplify S_Element helper getters if needed