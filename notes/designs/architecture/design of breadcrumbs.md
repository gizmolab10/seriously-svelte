# Design of Breadcrumbs Component

Analysis of the ORIGINAL Breadcrumbs.svelte component (before Phase 4 refactor).

## Original Component Responsibility

The Breadcrumbs component has ONE job: **Calculate layout and render breadcrumb buttons with separators**

### What It Does NOT Do

- It does NOT decide WHICH ancestries to show (that's determined by mode logic)
- It does NOT manage focus state
- It does NOT handle button clicks
- It does NOT change any application state

### What It DOES Do

**Input:** A list of Ancestry objects (from either heritage or recents)

**Process:** Calculate positions and widths for each breadcrumb button

**Output:** Render positioned breadcrumb buttons with separators

## Original Code Analysis

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

### The Trigger System

The `{#key trigger}` block forces a complete re-render of the HTML whenever `trigger` changes.

**Why is this needed?**

Because Breadcrumb_Button components maintain internal state (hover, focus highlighting). When focus changes, the SAME ancestry objects are passed in, but the buttons need to re-check which one is focused.

The `trigger` variable changes when:
1. **Layout changes** - `encoded_counts` changes (parent counts change)
2. **Component remounts** - `reattachments` increments
3. **Position shifts** - `lefts[0]` changes

### The Reactive Block

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

This tracks 10 different stores. When ANY of them change, it calls `update()`.

**Key insight:** Tracking `$w_ancestry_focus?.id` doesn't mean we USE focus to select data. It means when focus changes, we need to call `update()` which will recalculate layout and update the trigger, causing a re-render so the buttons can update their internal state.

## The Problem with Phase 4 Migration

In the refactor, we moved `ancestries_forBreadcrumbs()` to the parent (Primary_Controls).

**What we broke:**

The parent's reactive block runs and sets `breadcrumb_ancestries = $w_ancestry_forDetails?.heritage ?? []`

When focus changes:
1. Reactive block runs (tracks `$w_ancestry_focus?.id`)  
2. Sets breadcrumb_ancestries to the SAME array reference (forDetails.heritage)
3. Breadcrumbs component receives same prop value
4. Svelte sees no change (same array reference)
5. **Breadcrumbs doesn't update**
6. **Buttons don't re-check focus state**

## The Solution

The parent must FORCE Breadcrumbs to see a prop change even when the data is the same.

**Original approach:** Breadcrumbs internally called `update()` which recalculated the trigger, forcing `{#key trigger}` to re-render.

**Migrated approach:** Parent must pass a changing value that causes Breadcrumbs to re-run its layout calculation.

Options:
1. Pass a separate `key` prop that changes with focus
2. Pass focus ID as a prop so Breadcrumbs can track it
3. Have Breadcrumbs internally subscribe to focus changes

## Recommended Fix

Add a `focusId` prop to Breadcrumbs:

**Primary_Controls.svelte:**
```typescript
<Breadcrumbs
  ancestries={breadcrumb_ancestries}
  focusId={$w_ancestry_focus?.id}
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Breadcrumbs.svelte:**
```typescript
export let ancestries: Array<Ancestry>;
export let focusId: string | undefined;  // ADD THIS

$: {
  const _ = `...existing stores...
  :::${focusId}`;  // ADD THIS to reactive dependency
  update();
}
```

This preserves the original behavior: when focus changes, the reactive block runs, update() is called, trigger changes, and the `{#key trigger}` block re-renders the buttons.
