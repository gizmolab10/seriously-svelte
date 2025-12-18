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

### Current Implementation
- Colors computed in `S_Element` getters
- Components call `update_colors()` reactively
- `set_forHovering()` sets hover color and cursor

### Proposed Centralization
- [x] Define color schema per component/state
- [x] Centralize color computation logic
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

**Proposed Architecture:**

Create a `ColorComputer` service that:
- Takes inputs: component type, state flags, base colors
- Returns computed color values based on schema
- Encapsulates all conditional logic in one place
- Supports all component types (widget, drag, reveal, button)

**Key Design Decisions:**

1. **Single computation function per component type**
   - `computeWidgetColors(state, thing_color, background_color)`
   - `computeDotColors(state, element_color, thing_color, background_color)` (drag/reveal)
   - `computeButtonColors(state, element_color, background_color)`

2. **State object pattern**
   - Pass state object: `{ hover, grabbed, editing, focus, disabled, selected, isInverted }`
   - Avoids parameter explosion
   - Makes state combinations explicit

3. **Replace getters with computed properties**
   - `S_Element`/`S_Widget` getters call `ColorComputer` instead of inline logic
   - Components remain reactive but logic is centralized
   - Easier to test color logic in isolation

4. **Preserve reactive behavior**
   - Keep getter pattern so Svelte reactivity works
   - Getters become thin wrappers around `ColorComputer`
   - No changes to component reactive blocks

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

**S_Element:**
- **Keep as inputs**: `color_background`, `isDisabled`, `isSelected`, `isInverted`, `subtype`
- **Replace getters**: `fill`, `stroke`, `svg_outline_color`, `border` become thin wrappers calling `ColorComputer`
- **Simplify**: `color_isInverted` getter becomes input to state object (computed inline in ColorComputer call)
- **Remove**: Inline color logic from getters
- **Example transformation:**
  ```typescript
  // Before
  get fill(): string { 
    return this.asTransparent ? 'transparent' 
      : this.color_isInverted ? this.hoverColor 
      : this.isSelected ? 'lightblue' 
      : this.color_background; 
  }
  
  // After
  get fill(): string {
    return ColorComputer.computeElementColors({
      hover: this.isHovering,
      selected: this.isSelected,
      disabled: this.isDisabled,
      isInverted: this.isInverted,
      subtype: this.subtype
    }, this.element_color, this.hoverColor, this.color_background).fill;
  }
  ```

**S_Widget:**
- **Keep as inputs**: `isGrabbed`, `isEditing`, `isFocus`, `thing_color` getter
- **Replace getters**: `color`, `background_color`, `border` call `ColorComputer.computeWidgetColors()`
- **Remove**: `colorFor_grabbed_andEditing()` method - logic moves to ColorComputer
- **Simplify**: Helper getters like `isFilled`, `shows_border`, `isRadial_focus` may be computed inline in ColorComputer call
- **Example transformation:**
  ```typescript
  // Before
  get color(): string { 
    return this.colorFor_grabbed_andEditing(this.ancestry.isGrabbed, this.ancestry.isEditing); 
  }
  
  // After
  get color(): string {
    return ColorComputer.computeWidgetColors({
      hover: this.isHovering,
      grabbed: this.ancestry.isGrabbed,
      editing: this.ancestry.isEditing,
      focus: this.ancestry.isFocus
    }, this.thing_color, get(colors.w_background_color)).color;
  }
  ```

**State Collection Pattern:**
- Each getter collects relevant state from `this`, `this.ancestry`, and stores
- Passes complete state object to ColorComputer
- ColorComputer handles all conditional logic
- State objects become data containers + thin computation wrappers

**State Object Structure:**

The state object is a plain object passed to ColorComputer methods. It contains all boolean flags and context needed for color computation:

```typescript
interface ColorState {
  hover: boolean;           // From isHovering (hits.w_s_hover)
  grabbed?: boolean;        // From ancestry.isGrabbed (widget only)
  editing?: boolean;        // From ancestry.isEditing (widget only)
  focus?: boolean;          // From ancestry.isFocus (widget only)
  disabled?: boolean;       // From isDisabled
  selected?: boolean;       // From isSelected (buttons)
  isInverted?: boolean;     // From isInverted flag
  subtype?: string;         // For special cases (e.g., T_Control.details)
}

// Example usage:
const state: ColorState = {
  hover: this.isHovering,
  grabbed: this.ancestry?.isGrabbed,
  editing: this.ancestry?.isEditing,
  focus: this.ancestry?.isFocus,
  disabled: this.isDisabled,
  selected: this.isSelected,
  isInverted: this.isInverted,
  subtype: this.subtype
};
```

**Key characteristics:**
- All properties are optional except `hover` (always present)
- Widget-specific states (`grabbed`, `editing`, `focus`) only relevant for widget/dot components
- `isInverted` represents the XOR of `isInverted` flag and `hover` state
- Component type determines which state properties are used
- State object is created fresh on each getter call (no caching needed due to Svelte reactivity)

**Migration Strategy:**
1. Implement ColorComputer with same logic as current getters (verify parity)
2. Replace getters one at a time, starting with most duplicated (fill/stroke)
3. Remove helper methods once fully migrated
4. Simplify state object properties over time as patterns emerge

## Color Computer

### Manager/UX Pattern Discussion

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

**Recommendation:**

Use **static utility class** approach:
- `export class ColorComputer { static computeWidgetColors(...), static computeDotColors(...), ... }`
- Simpler, more appropriate for pure computation
- Still follows codebase pattern (class-based, in managers directory)
- Easy to convert to manager pattern later if state/stores needed
- Clearer separation: pure computation doesn't need instance

## Notes

- Colors respond to: hover, grab, edit, focus
- Inversion logic: `isInverted != isHovering` (XOR)
- Background color from `colors.w_background_color`
- Thing color from `ancestry.thing?.color`
- Only widgets can have selected, editing or focus state.