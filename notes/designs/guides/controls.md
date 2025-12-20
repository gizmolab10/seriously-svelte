# Controls Layout: The `lefts` Array System

This document describes how the `lefts` array is computed and used for positioning controls in `Primary_Controls.svelte`, and how to reorder controls.

## Overview

The `lefts` array provides horizontal positions (x-coordinates) for controls in the primary controls bar. It's computed from a `left_widths` object that defines the width of each control segment, then converted to cumulative positions.

## How `lefts` is Computed

### Step 1: Define Widths

The `left_widths` object in `layout_controls()` defines the width of each control segment using numeric keys:

```43:55:src/lib/svelte/controls/Primary_Controls.svelte
function layout_controls() {
	const left_widths = {
		0: features.has_details_button ? 18  : -7,									// details
		1: 11,																		// recents
		2: features.allow_tree_mode	   ? 54  : 0,									// graph type
		3: features.has_zoom_controls  ? 100 : features.allow_tree_mode ? 66 : 34,	// plus
		4: features.has_zoom_controls  ? 26  : 0,									// minus
		5: features.allow_search	   ? 22  : 6,									// easter egg
		6: 23,																		// separator
		7: 42,																		// search toggle
		8: -40,																		// breadcrumbs
	};
	lefts = u.cumulativeSum(Object.values(left_widths));
}
```

### Step 2: Extract Values in Key Order

`Object.values(left_widths)` extracts the width values in numeric key order (0, 1, 2, 3, 4, 5, 6, 7, 8). This order determines the left-to-right sequence of controls.

### Step 3: Compute Cumulative Sum

`u.cumulativeSum()` converts widths to cumulative positions. For example:
- Input widths: `[18, 11, 54, 100, 26, 22, 23, 42, -40]`
- Output `lefts`: `[18, 29, 83, 183, 209, 231, 254, 296, 256]`

Each value in `lefts` represents the cumulative sum up to that point, giving the x-coordinate where each control segment should start.

## Control Order

The order of controls (left to right) is determined by the numeric keys in `left_widths`:

| Index | Control | HTML Usage |
|-------|---------|------------|
| 0 | details button | `lefts[0]` - line 80 |
| 1 | recents (next/previous) | `lefts[1]` - line 72 |
| 2 | graph type segmented | `lefts[2]` - line 107 |
| 3 | plus (grow) button | `lefts[3]` - line 118 |
| 4 | minus (shrink) button | `lefts[4]` - line 133 |
| 5 | easter egg / separator | `lefts[5]` - lines 153, 161, 172 |
| 6 | breadcrumbs start | `lefts[6]` - line 166 |
| 7 | search toggle width | `lefts[7]` - line 101 |
| 8 | breadcrumbs end | `lefts[8]` - line 168 |

## How to Change the Order of Controls

### (a) Change the Order in `left_widths`

To reorder controls, you must renumber the keys in the `left_widths` object. The keys must remain sequential starting from 0, but you can reassign which control gets which key.

**Example: Swap "recents" and "graph type"**

**Before:**
```typescript
const left_widths = {
	0: ..., // details
	1: 11,  // recents
	2: ..., // graph type
	...
};
```

**After:**
```typescript
const left_widths = {
	0: ..., // details
	1: ..., // graph type (moved from index 2)
	2: 11,  // recents (moved from index 1)
	...
};
```

### (b) Update HTML Indices to Match

After reordering `left_widths`, you must update all HTML references to use the new indices.

**Example: After swapping recents and graph type**

1. **Update recents** (was `lefts[1]`, now `lefts[2]`):
```72:72:src/lib/svelte/controls/Primary_Controls.svelte
origin={Point.x(lefts[1])}
```
Change to:
```typescript
origin={Point.x(lefts[2])}
```

2. **Update graph type** (was `lefts[2]`, now `lefts[1]`):
```107:107:src/lib/svelte/controls/Primary_Controls.svelte
origin={Point.x(lefts[2])}
```
Change to:
```typescript
origin={Point.x(lefts[1])}
```

## Complete Reordering Workflow

1. **Identify the controls to swap** - Note their current indices in `left_widths`
2. **Swap the keys in `left_widths`** - Reassign numeric keys while keeping sequential order
3. **Find all HTML usages** - Search for `lefts[oldIndex]` in the template
4. **Update each reference** - Change `lefts[oldIndex]` to `lefts[newIndex]`
5. **Verify spacing** - Adjust width values if needed to maintain proper spacing

## Important Notes

- **Sequential keys required**: Keys must be 0, 1, 2, 3... (no gaps)
- **Width values matter**: Negative values create spacing/overlap (e.g., index 8 uses -40 for breadcrumbs end)
- **Feature flags affect widths**: Many widths are conditional based on `features.has_*` flags
- **Multiple usages**: Some indices are used multiple times (e.g., `lefts[5]` for easter egg and separator)
- **Cumulative nature**: Changing a width at index N affects all subsequent positions

## Example: Moving "details" to the End

If you wanted to move the details button to the rightmost position:

1. **Reorder `left_widths`**:
```typescript
const left_widths = {
	0: 11,  // recents (was 1)
	1: ..., // graph type (was 2)
	2: ..., // plus (was 3)
	3: ..., // minus (was 4)
	4: ..., // easter egg (was 5)
	5: 23,  // separator (was 6)
	6: 42,  // search toggle (was 7)
	7: -40, // breadcrumbs (was 8)
	8: features.has_details_button ? 18 : -7, // details (was 0)
};
```

2. **Update HTML references**:
   - Change `lefts[0]` (details) → `lefts[8]`
   - Change `lefts[1]` (recents) → `lefts[0]`
   - Change `lefts[2]` (graph type) → `lefts[1]`
   - ... and so on for all affected controls

