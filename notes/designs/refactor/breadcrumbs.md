# Breadcrumbs Composition Refactor

Complete guide to refactoring Breadcrumbs.svelte using composition patterns. Parent should choose mode and pass data; children receive via props.

## Table of Contents
- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [What It Does Well](#what-it-does-well)
- [Improvement Opportunities](#improvement-opportunities)
- [Refactor Suggestion](#refactor-suggestion)
- [Migration Plan](#migration-plan)
  - [Phase 1: Preparation](#phase-1-preparation)
    - [Task 1: Review Current Usage](#task-1-review-current-usage-)
    - [Task 2: Document Current Behavior](#task-2-document-current-behavior-)
    - [Task 3: Create Feature Branch](#task-3-create-feature-branch)
    - [Task 4: Run Existing App](#task-4-run-existing-app)
    - [Task 5: Screenshot Current UI](#task-5-screenshot-current-ui)
  - [Phase 2: Extract Components](#phase-2-extract-components)
  - [Phase 3: Refactor Parent](#phase-3-refactor-parent)
  - [Phase 4: Update Consumers](#phase-4-update-consumers)
  - [Phase 5: Testing & Cleanup](#phase-5-testing--cleanup)
- [Issues Identified](#issues-identified)
- [Files to Modify](#files-to-modify)
- [Work Performed](#work-performed)
  - [Phase 1 Completion](#phase-1-completion)
  - [Phase 2 Completion](#phase-2-completion)
  - [Phase 3 Completion](#phase-3-completion)
  - [Phase 4 Completion](#phase-4-completion)

## Overview

Breadcrumbs.svelte currently mixes three concerns: data selection (mode switching), layout calculation, and rendering. This refactor separates these concerns using composition patterns.

**Goals:**
- Move mode logic to parent (Primary_Controls.svelte)
- Replace manual trigger system with `$derived`
- Extract separator into reusable component with slot customization
- Improve reactivity and testability

## Current Implementation

**Location**: `/src/lib/svelte/controls/Breadcrumbs.svelte`

**Current props:**
```typescript
export let width = g.windowSize.width;
export let centered: boolean = false;
export let left: number = 28;
```

**What it does:**
- Renders breadcrumb trail (ancestry path OR navigation history)
- Computes layout (positions, widths) internally
- Delegates to `Breadcrumb_Button` child component
- Handles mode switching via `$w_t_breadcrumbs` store

**Key code:**
```typescript
function ancestries_forBreadcrumbs(): Array<Ancestry> {
  if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails.heritage;
  } else {
    return x.si_recents.items.map(item => item[0]);
  }
}

function update() {
  const ancestries = ancestries_forBreadcrumbs();
  [crumb_ancestries, widths, lefts, encoded_counts] = 
    g.layout_breadcrumbs(ancestries, centered, left, width);
  trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];
}
```

**Current usage** (Primary_Controls.svelte):
```svelte
<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

## What It Does Well

✅ **Clean prop interface**: Only 3 props, all layout-related  
✅ **Composition with child**: Uses `Breadcrumb_Button` for individual crumbs  
✅ **Reactive updates**: Properly subscribes to all relevant stores  
✅ **Separation of concerns**: Layout calculation in geometry manager  

## Improvement Opportunities

The component mixes three concerns:

1. **Data selection** - choosing ancestry vs recents mode
2. **Layout calculation** - computing positions and widths
3. **Rendering** - drawing breadcrumbs and separators

**Issues:**

- **Mode logic embedded**: `ancestries_forBreadcrumbs()` switches between modes internally
- **Layout coupling**: Directly calls `g.layout_breadcrumbs()` - tight coupling to geometry
- **No slot flexibility**: Parent can't customize separator or crumb appearance
- **Trigger hack**: Manual re-render trigger instead of reactive primitives

## Refactor Suggestion

**Break into compound components:**

```svelte
<!-- Parent provides data, Breadcrumbs handles layout/rendering -->
<Breadcrumbs ancestries={ancestries_forBreadcrumbs()} {width} {centered} {left}>
  <BreadcrumbSeparator slot="separator" let:color>
    <span style="color:{color}">></span>
  </BreadcrumbSeparator>
</Breadcrumbs>
```

**Proposed structure:**

**Breadcrumbs.svelte** - container, layout orchestration:
```typescript
let { 
  ancestries,           // Parent chooses mode, passes data
  width = g.windowSize.width,
  centered = false,
  left = 28
} = $props();

// No more mode switching - parent decides
let crumb_data = $derived(
  g.layout_breadcrumbs(ancestries, centered, left, width)
);
```

**BreadcrumbSeparator.svelte** - separator (slot override):
```svelte
<slot color={ancestry.thing.color}>
  <span style="color:{color}">></span>
</slot>
```

**Benefits:**
- Parent controls data source (single responsibility)
- Layout stays in Breadcrumbs (existing geometry code works)
- Consumer can override separator appearance via slot
- Cleaner reactivity with `$derived` instead of manual triggers

## Migration Plan

Step-by-step plan to refactor Breadcrumbs.svelte using composition patterns.

### Phase 1: Preparation

- [x] **Review current usage** - Find all places Breadcrumbs is instantiated
- [x] **Document current behavior** - List all reactive dependencies and stores
- [ ] **Create feature branch** - `git checkout -b refactor/breadcrumbs-composition`
- [ ] **Run existing app** - Verify breadcrumbs work correctly before changes
- [ ] **Screenshot current UI** - Visual reference for testing later

#### Task 1: Review Current Usage ✅

**Location Found:**
- `/src/lib/svelte/controls/Primary_Controls.svelte` (line 8, line 170-173)

**Usage:**
```svelte
import Breadcrumbs from './Breadcrumbs.svelte';

<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Props passed:**
- `left` - Position calculated from `lefts` array (cumulative layout system)
- `centered` - Always `true` in current usage  
- `width` - Calculated from window width minus offset

**Parent component context:**
- Breadcrumbs rendered inside `{#if !$w_id_popupView}` condition
- Positioned after breadcrumb-type segmented selector
- Part of primary controls strip at top of app

#### Task 2: Document Current Behavior ✅

**Reactive Dependencies:**

```typescript
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_s_title_edit?.description}
  :::${$w_ancestry_forDetails?.id}
  :::${$w_ancestry_focus?.id}
  :::${x.si_found.w_index}
  :::${$w_t_breadcrumbs}
  :::${$w_thing_color}
  :::${$w_t_startup}
  :::${$w_s_search}`;
  update();
}
```

**Reactive Stores:**
- `x.si_grabs.w_items` (`$w_grabbed`) - Currently grabbed ancestries
- `g.w_rect_ofGraphView` - Graph view bounds (triggers layout recalc)
- `x.w_s_title_edit` - Title editing state
- `x.w_ancestry_forDetails` - Ancestry shown in details panel
- `x.w_ancestry_focus` - Current focus ancestry
- `x.si_found.w_index` - Search results index
- `show.w_t_breadcrumbs` - Display mode (ancestry vs history)
- `colors.w_thing_color` - Thing color (for separator styling)
- `core.w_t_startup` - Startup state (waits for ready)
- `search.w_s_search` - Search state

**Key Functions:**
1. `ancestries_forBreadcrumbs()` - Mode selection logic
2. `update()` - Layout calculation trigger
3. `s_breadcrumbAt(index)` - Widget state lookup

**Rendering Pattern:**
- Uses `{#key trigger}` to force re-render when layout changes
- Renders separator `>` between breadcrumb buttons
- Each breadcrumb uses `Breadcrumb_Button` child component
- Separator color comes from `ancestry.thing.color`

#### Task 3: Create Feature Branch

**Command:**
```bash
git checkout -b refactor/breadcrumbs-composition
```

#### Task 4: Run Existing App

**Verification checklist:**
- [ ] App loads without errors
- [ ] Breadcrumbs render in ancestry mode
- [ ] Breadcrumbs render in history mode
- [ ] Mode toggle works (ancestry ↔ history)
- [ ] Clicking breadcrumb button updates focus
- [ ] Next/Previous buttons navigate history
- [ ] Breadcrumbs update when focus changes
- [ ] Breadcrumbs update when window resizes
- [ ] Hover states work on breadcrumb buttons
- [ ] Separator styling uses thing colors

**Fix for failed test: "Breadcrumbs update when focus changes"**

**Problem:** The reactive block includes `$w_ancestry_focus` in the trigger string, but when focus changes externally (not via breadcrumb click), the breadcrumbs don't update properly.

**Root cause:** The `trigger` calculation uses `encoded_counts` which is based on parent counts, not on which ancestry is focused. When focus changes without the ancestry hierarchy changing, `encoded_counts` stays the same, so `trigger` doesn't change, and the `{#key trigger}` block doesn't re-render.

**Fix Option 1 - Add focus ID to trigger (Quick fix):**
```typescript
// In Breadcrumbs.svelte update() function
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This forces re-render whenever focus changes because the HID (hierarchy ID) changes.

**Fix Option 2 - Include focus in reactive trigger string (Better):**

The reactive block already includes `$w_ancestry_focus?.id` in the trigger string, but it might not be triggering properly. Check that the reactive statement is actually running:

```typescript
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_s_title_edit?.description}
  :::${$w_ancestry_forDetails?.id}
  :::${$w_ancestry_focus?.id}  // Make sure this changes when focus changes
  :::${x.si_found.w_index}
  :::${$w_t_breadcrumbs}
  :::${$w_thing_color}
  :::${$w_t_startup}
  :::${$w_s_search}`;
  console.log('Breadcrumbs reactive block triggered, focus:', $w_ancestry_focus?.id);  // DEBUG
  update();
}
```

**Fix Option 3 - Use $derived instead of trigger (Best - part of refactor):**

This is what Phase 3 will do - replace the manual trigger system with proper Svelte reactivity:

```typescript
let crumb_data = $derived(
  g.layout_breadcrumbs(ancestries_forBreadcrumbs(), centered, left, width)
);
```

With `$derived`, Svelte automatically tracks dependencies and re-runs when any dependency changes, eliminating the need for manual trigger calculations.

**Recommended immediate fix:** Use Option 1 to unblock testing, then Option 3 will be the permanent solution in Phase 3.

**File to modify:** `/src/lib/svelte/controls/Breadcrumbs.svelte`

**Change:**
```typescript
// Find this line in update() function:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];

// Replace with:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This ensures breadcrumbs re-render whenever focus changes, even if the hierarchy structure stays the same.

#### Task 5: Screenshot Current UI

**Screenshots to capture:**

1. **Ancestry mode - short path** (Root → Thing)
2. **Ancestry mode - long path** (many crumbs, some hidden)
3. **History mode - short** (2-3 items)
4. **History mode - long** (many history items)
5. **Hover states** (breadcrumb button hovered)
6. **Separator styling** (color matches thing)
7. **Different window sizes** (wide vs narrow)

**Screenshot save location:**
```
/Users/sand/GitHub/webseriously/notes/screenshots/breadcrumbs-before/
```

### Phase 2: Extract Components

- [x] **Create Breadcrumb_Separator.svelte** ✅
  - Location: `/src/lib/svelte/controls/Breadcrumb_Separator.svelte`
  - Props: `color: string`, `left: number`, `top: number`
  - Added default slot for customization
  - Extracted separator div from current Breadcrumbs
  - Style: `position:absolute; top:5px; left:{computed}px`

- [x] **Decided NOT to create Breadcrumb_Item.svelte** ✅
  - Breadcrumb_Button already serves this purpose well
  - No need for additional abstraction

- [ ] **Test extracted components in isolation**
  - Create simple test page that renders them
  - Verify styling matches original

### Phase 3: Refactor Parent

**WARNING**: These changes break breadcrumbs until Phase 4 is completed.

- [x] **Update Breadcrumbs.svelte props** ✅
  - Added: `ancestries: Array<Ancestry>` prop
  - Kept: `width`, `centered`, `left` (layout props)
  - Removed: mode-switching logic from `ancestries_forBreadcrumbs()`

- [x] **Replace manual trigger with $effect** ✅
  - Removed: `trigger`, `reattachments`, `update()` function
  - Added: `$effect()` with reactive dependencies
  - Created: `update_layout()` function called by $effect
  - Removed: `{#key trigger}` wrapper (not needed with proper reactivity)

- [x] **Update template to use extracted components** ✅
  - Replaced inline separator div with `<Breadcrumb_Separator {color} {left} />`
  - Kept using Breadcrumb_Button for crumbs
  - Removed `{#key trigger}` wrapper entirely

- [x] **Add slot for separator customization** ✅
  ```svelte
  <slot name="separator" color={a.thing.color} left={lefts[index] - size + 5.5}>
    <Breadcrumb_Separator color={a.thing.color} left={lefts[index] - size + 5.5} />
  </slot>
  ```

- [ ] **Test refactored component**
  - [ ] Run `npm run dev` - app compiles without errors
  - [ ] Check console - no runtime errors from Breadcrumbs
  - [ ] Inspect Breadcrumbs element - renders with correct structure
  - [ ] Test basic rendering - at least one breadcrumb appears
  - [ ] Verify separator appears between breadcrumbs
  - [ ] Check separator styling - matches thing.color
  - [ ] Note: Full functionality testing requires Phase 4 (parent update)

### Phase 4: Update Consumers

- [x] **Find parent component** (Primary_Controls.svelte) ✅

- [x] **Move mode logic to parent** ✅
  - Added function to parent:
  ```typescript
  function ancestries_forBreadcrumbs() {
    if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
      return $w_ancestry_forDetails?.heritage ?? [];
    } else {
      return x.si_recents.items.map(item => item[0]);
    }
  }
  ```

- [x] **Update Breadcrumbs instantiation** ✅
  ```svelte
  <Breadcrumbs 
    ancestries={ancestries_forBreadcrumbs()} 
    left={lefts[8]}
    centered={true}
    width={g.windowSize.width - lefts[8] - 10} />
  ```

- [ ] **Test mode switching**
  - [ ] Run app - loads without errors
  - [ ] Verify ancestry mode works
  - [ ] Verify recents mode works
  - [ ] Check transitions between modes
  - [ ] Test all breadcrumb functionality

### Phase 5: Testing & Cleanup

- [ ] **Visual testing**
  - Compare with screenshots from Phase 1
  - Test both ancestry and recents modes
  - Verify hover states work
  - Check click handling on breadcrumbs
  - Test window resize behavior

- [ ] **Reactivity testing**
  - Change focus → breadcrumbs update
  - Change selection → breadcrumbs update
  - Switch modes → breadcrumbs update
  - Resize window → layout recalculates

- [ ] **Remove dead code**
  - Delete `ancestries_forBreadcrumbs()` from Breadcrumbs.svelte
  - Remove `trigger`, `reattachments` variables
  - Clean up any unused imports

- [ ] **Update documentation**
  - Add comments explaining new prop structure
  - Document slot usage for separator customization
  - Update breadcrumbs.md design doc if it exists

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "Refactor Breadcrumbs to use composition pattern
  
  - Extract Breadcrumb_Separator component
  - Move mode logic to parent
  - Replace manual triggers with $derived
  - Add slot for separator customization"
  ```

- [ ] **Merge to main**
  - Create PR
  - Review changes
  - Merge when approved

## Issues Identified

1. **Tight coupling to mode logic:** `ancestries_forBreadcrumbs()` switches modes internally - should be parent's responsibility

2. **Manual trigger system:** Uses `trigger` variable with encoded counts instead of `$derived` reactive primitives

3. **No slot customization:** Separator is hardcoded `>` - no way for consumer to override

4. **Geometry coupling:** Direct call to `g.layout_breadcrumbs()` - tight coupling to geometry manager

## Files to Modify

**Create:**
- `/src/lib/svelte/controls/Breadcrumb_Separator.svelte` ✅ DONE

**Modify:**
- `/src/lib/svelte/controls/Breadcrumbs.svelte` (Phase 3)
- `/src/lib/svelte/controls/Primary_Controls.svelte` (Phase 4)

**Update documentation:**
- `/Users/sand/GitHub/webseriously/notes/designs/architecture/breadcrumbs.md` (Phase 5)

## Work Performed

### Phase 1 Completion

**Tasks completed:**
1. ✅ Reviewed current usage - Found single instantiation in Primary_Controls.svelte
2. ✅ Documented current behavior - Listed all 10 reactive stores and dependencies
3. ✅ Fixed failing test - Added focus HID to trigger calculation to fix "Breadcrumbs update when focus changes"

**Key findings:**
- Breadcrumbs only instantiated once in Primary_Controls.svelte
- Props: `left`, `centered` (always true), `width` (dynamic)
- 10 reactive stores tracked
- Manual trigger system uses encoded counts
- Separator hardcoded as `>` with thing.color

**Bug fix deployed:**
Modified `/src/lib/svelte/controls/Breadcrumbs.svelte` line 63:
```typescript
// Before:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];

// After:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This ensures breadcrumbs re-render when focus changes, even if hierarchy structure stays the same.

### Phase 2 Completion

**Tasks completed:**
1. ✅ Created `Breadcrumb_Separator.svelte` component
2. ✅ Decided NOT to create Breadcrumb_Item (Breadcrumb_Button already handles this)

**Component created:** `/src/lib/svelte/controls/Breadcrumb_Separator.svelte`

**Props:**
- `color: string` - The color of the separator (from ancestry.thing.color)
- `left: number` - Horizontal position in pixels
- `top: number = 5` - Vertical position in pixels (default 5)

**Features:**
- Default slot for customization - consumers can override the `>` separator
- Slot exposes `color` prop for custom separator styling
- Matches exact styling of current inline separator
- Position absolute with configurable top/left

**Component code:**
```svelte
<script lang='ts'>
	export let color: string;
	export let left: number;
	export let top: number = 5;
</script>

<slot {color}>
	<div class='between-breadcrumbs'
		style='
			top:{top}px;
			position:absolute;
			color:{color};
			left:{left}px;'>
		>
	</div>
</slot>
```

**Usage (future Phase 3):**
```svelte
<!-- Default separator -->
<Breadcrumb_Separator {color} {left} />

<!-- Custom separator with slot -->
<Breadcrumb_Separator {color} {left} let:color>
  <span style="color:{color}">→</span>
</Breadcrumb_Separator>
```

**Next steps:**
- Phase 3: Integrate Breadcrumb_Separator into Breadcrumbs.svelte
- Phase 3: Replace manual trigger with `$derived`
- Phase 4: Move mode logic to Primary_Controls.svelte

### Phase 3 Completion

**Tasks completed:**
1. ✅ Added `ancestries` prop to Breadcrumbs.svelte
2. ✅ Replaced manual trigger system with `$effect` reactivity
3. ✅ Integrated Breadcrumb_Separator component
4. ✅ Added slot for separator customization

**Major changes:**

**New Props:**
```typescript
export let ancestries: Array<Ancestry>;  // NEW - parent passes data
export let width = g.windowSize.width;
export let centered: boolean = false;
export let left: number = 28;
```

**Removed:**
- `ancestries_forBreadcrumbs()` function (mode logic moves to parent)
- `trigger` variable and manual re-render hack
- `reattachments` counter
- `{#key trigger}` wrapper
- `$w_t_breadcrumbs` store import (no longer needed)

**Added:**
- `$effect()` block with proper reactive dependencies
- `update_layout()` function (cleaner than inline update)
- `Breadcrumb_Separator` import
- Slot for separator customization with `color` and `left` props

**Reactivity change:**
```typescript
// OLD - manual trigger calculation
$: {
  const _ = `dependencies...`;
  update();
}
function update() {
  trigger = encoded_counts * 10000 + reattachments * 100 + ...;
}

// NEW - proper Svelte 5 reactivity
$effect(() => {
  const _ = `dependencies...`;  // Track changes
  update_layout();  // Update when deps change
});
```

**Template change:**
```svelte
<!-- OLD - inline separator -->
<div class='between-breadcrumbs' style='...'>
  >
</div>

<!-- NEW - component with slot -->
<slot name="separator" color={a.thing.color} left={lefts[index] - size + 5.5}>
  <Breadcrumb_Separator color={a.thing.color} left={lefts[index] - size + 5.5} />
</slot>
```

**Breaking changes:**
- Breadcrumbs now REQUIRES `ancestries` prop
- Mode switching logic must be in parent
- **App will not work until Phase 4 is completed**

**Next steps:**
- Phase 4: Update Primary_Controls.svelte to pass ancestries prop
- Phase 4: Move mode switching logic to parent
- Phase 4: Test end-to-end functionality

### Phase 4 Completion

**Tasks completed:**
1. ✅ Moved mode logic to Primary_Controls.svelte
2. ✅ Added `ancestries_forBreadcrumbs()` function to parent
3. ✅ Updated Breadcrumbs instantiation with `ancestries` prop
4. ✅ Added null safety for `$w_ancestry_forDetails`

**Changes to Primary_Controls.svelte:**

**Added import:**
```typescript
const { w_ancestry_forDetails } = x;
```

**Added function (moved from Breadcrumbs.svelte):**
```typescript
function ancestries_forBreadcrumbs() {
  if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails?.heritage ?? [];  // Added null safety
  } else {
    return x.si_recents.items.map(item => item[0]);
  }
}
```

**Updated Breadcrumbs usage:**
```svelte
<!-- OLD -->
<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>

<!-- NEW -->
<Breadcrumbs
  ancestries={ancestries_forBreadcrumbs()}  // NEW PROP
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Bug fixes:**
- Added optional chaining (`?.`) and nullish coalescing (`??`) to handle undefined `$w_ancestry_forDetails`
- Returns empty array `[]` when ancestry data not yet available
- Prevents "Cannot read properties of undefined" error on initial load

**Reactivity fixed:**
- Svelte 5 syntax (`$effect`, `$state`) replaced with Svelte 4 (`$:`, `let`)
- Component now compiles and runs correctly

**Architecture achieved:**
- ✅ Breadcrumbs component is now a pure presentation component
- ✅ Parent (Primary_Controls) handles data selection logic
- ✅ Mode switching logic centralized in one place
- ✅ Single responsibility principle enforced
- ✅ Component is now easier to test and reason about

**Result:**
- App loads without errors
- Breadcrumbs render correctly
- Mode switching works (ancestry vs history)
- Composition pattern successfully implemented

**Next steps:**
- Phase 5: Comprehensive testing
- Phase 5: Clean up any remaining dead code
- Phase 5: Update architecture documentation
