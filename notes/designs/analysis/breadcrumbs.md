# Breadcrumbs Design Analysis

## Overview

The breadcrumbs system provides navigation through the ancestry hierarchy and browsing history. It consists of three integrated components that work together to display and navigate between different ancestries in the graph.

## Three Parts

### 1. Selector (Segmented Component)

**Location**: `src/lib/svelte/controls/Primary_Controls.svelte` (lines 153-158)

The selector is a segmented control that allows users to switch between two breadcrumb display modes:

- **`T_Breadcrumbs.ancestry`**: Shows the heritage path from root to the current `ancestry_forDetails`
- **`T_Breadcrumbs.history`**: Shows the navigation history stored in `x.si_recents`

**Implementation**: Uses `Segmented` component with `handle_breadcrumbs` callback that updates `show.w_t_breadcrumbs` store.

**Key Reference in UX.ts**: The mode selection determines which data source `Breadcrumbs.svelte` uses (see `ancestries_forBreadcrumbs()` function).

### 2. Next/Previous (Next_Previous Component)

**Location**: `src/lib/svelte/controls/Primary_Controls.svelte` (lines 81-85)

The next/previous buttons allow navigation through the recents history when in history mode.

**Implementation**: 
- Uses `Next_Previous` component with `handle_recents_mouseClick` closure
- Calls `x.ancestry_next_focusOn(index == 1)` where `index == 1` means "next" (down/forward)

**Key Reference in UX.ts**: 
- `ancestry_next_focusOn(next: boolean)` (lines 80-98)
  - Navigates through `x.si_recents` using `si_recents.find_next_item(next)`
  - Extracts the current item as `[Ancestry, S_Items<Ancestry> | null]` pair
  - Sets focus ancestry and restores the associated grabs
  - Ensures all grabbed ancestries are visible via `ancestry_assureIsVisible()`

### 3. Crumb Buttons (Breadcrumb_Button Components)

**Location**: `src/lib/svelte/mouse/Breadcrumb_Button.svelte`

Individual clickable buttons for each ancestry in the breadcrumb trail. Each button displays the ancestry's `breadcrumb_title` and allows direct navigation to that ancestry.

**Implementation**:
- Each button calls `ancestry.becomeFocus()` on click (line 65)
- This updates the focus and adds the ancestry to recents history
- Buttons are styled with colors from the ancestry's thing

**Key Reference in UX.ts**:
- `becomeFocus(ancestry: Ancestry)` (lines 100-113)
  - Creates a pair `[ancestry, this.si_grabs]` and pushes to `x.si_recents`
  - Sets the focus ancestry and expands it
  - Updates `ancestry_forDetails`

## Responsibilities

### Breadcrumbs Component (`src/lib/svelte/controls/Breadcrumbs.svelte`)

**Primary Responsibilities**:
1. **Data Source Selection**: Chooses between ancestry heritage or recents history based on `w_t_breadcrumbs` mode
2. **Layout Calculation**: Delegates to `g.layout_breadcrumbs()` to determine which ancestries fit and their positions
3. **Reactive Updates**: Responds to changes in:
   - `w_t_breadcrumbs` (mode selector)
   - `w_ancestry_forDetails` (current ancestry)
   - `x.si_recents` (history)
   - `x.si_grabs` (grabbed items)
   - `w_rect_ofGraphView` (window size)
   - `w_s_title_edit` (editing state)
   - `w_s_search` (search state)
4. **Rendering**: Creates `Breadcrumb_Button` components for each visible ancestry with separators between them

**Key Function**: `ancestries_forBreadcrumbs()` (lines 49-55)
```typescript
if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails.heritage;  // Path from root to current
} else {
    return x.si_recents.items.map(item => item[0]);  // History of focus changes
}
```

### UX.ts Manager (`src/lib/ts/managers/UX.ts`)

**Primary Responsibilities**:

1. **Recents Management** (`si_recents: S_Items<Identifiable_S_Items_Pair>`):
   - Stores pairs of `[Ancestry, S_Items<Ancestry> | null]`
   - First element: the focus ancestry at that point in history
   - Second element: the grabs associated with that focus (or null)
   - Maintains navigation history as user moves through the graph

2. **Focus Navigation** (`ancestry_next_focusOn(next: boolean)`):
   - Navigates through recents using `si_recents.find_next_item(next)`
   - Restores both focus ancestry and associated grabs
   - Ensures visibility of all grabbed ancestries
   - Expands the focus ancestry

3. **Focus Recording** (`becomeFocus(ancestry: Ancestry)`):
   - Called when any ancestry becomes focus (including crumb button clicks)
   - Creates history entry: `[ancestry, this.si_grabs]`
   - Pushes to `si_recents` for history tracking
   - Updates focus store and expands ancestry

4. **Grabs Management** (`si_grabs: S_Items<Ancestry>`):
   - Tracks currently selected/grabbed ancestries
   - Preserved with each focus change in recents
   - Restored when navigating history

## Core Design

### Data Flow

```
User Action
    ↓
[Selector] → Updates w_t_breadcrumbs
    ↓
[Breadcrumbs] → ancestries_forBreadcrumbs()
    ↓
    ├─ ancestry mode: ancestry_forDetails.heritage
    └─ history mode: x.si_recents.items.map(item => item[0])
    ↓
[Layout] → g.layout_breadcrumbs() → [crumb_ancestries, widths, lefts]
    ↓
[Render] → Breadcrumb_Button components
    ↓
[Click] → ancestry.becomeFocus()
    ↓
[UX.ts] → becomeFocus() → si_recents.push([ancestry, si_grabs])
    ↓
[Update] → Breadcrumbs reactive block triggers
```

### State Management

**Stores** (from UX.ts):
- `x.si_recents`: History of `[Ancestry, S_Items<Ancestry>]` pairs
- `s.w_ancestry_focus`: Current focus ancestry
- `s.w_ancestry_forDetails`: Ancestry shown in details panel
- `x.si_grabs`: Currently grabbed ancestries
- `show.w_t_breadcrumbs`: Display mode (ancestry vs history)

**Key Relationships**:
- Each entry in `si_recents` represents a navigation point with its associated grabs
- `ancestry_forDetails` determines which ancestries are shown in ancestry mode
- `si_recents` determines which ancestries are shown in history mode
- Grabs are preserved and restored when navigating history

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Breadcrumbs System                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Selector   │  Toggles between ancestry/history mode
│  (Segmented) │  Updates: show.w_t_breadcrumbs
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Breadcrumbs Component                           │
│  ancestries_forBreadcrumbs()                                 │
│    ├─ ancestry mode → ancestry_forDetails.heritage           │
│    └─ history mode → x.si_recents.items.map(item => item[0])│
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Geometry.layout_breadcrumbs()                   │
│  - Calculates which ancestries fit in available width        │
│  - Determines positions (lefts array)                       │
│  - Returns: [crumb_ancestries, widths, lefts, encoded_counts] │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Render Breadcrumb_Button Components            │
│  - One button per visible ancestry                          │
│  - Separators between buttons                               │
│  - Styled with ancestry.thing colors                        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              User Clicks Crumb Button                        │
│  → ancestry.becomeFocus()                                   │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              UX.ts.becomeFocus()                             │
│  - Creates pair: [ancestry, si_grabs]                       │
│  - x.si_recents.push(pair)                                  │
│  - s.w_ancestry_focus.set(ancestry)                         │
│  - ancestry.expand()                                        │
│  - x.update_ancestry_forDetails()                           │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Reactive Update                                 │
│  Breadcrumbs component reactive block triggers              │
│  → update() → Re-render with new ancestries                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Next/Previous Navigation                        │
│  User clicks next/previous buttons                           │
│  → x.ancestry_next_focusOn(next)                             │
│    - si_recents.find_next_item(next)                        │
│    - Extract [focus, grabs] from current item                │
│    - Restore focus and grabs                                │
│    - Ensure visibility                                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Interactions with UX.ts

### 1. History Recording
When any ancestry becomes focus (via crumb click, graph navigation, etc.):
- `ancestry.becomeFocus()` → `x.becomeFocus(ancestry)`
- Creates pair: `[ancestry, x.si_grabs]`
- Pushes to `x.si_recents` (line 105)

### 2. History Navigation
When user clicks next/previous buttons:
- `x.ancestry_next_focusOn(next)` (line 80)
- Navigates `x.si_recents` collection
- Restores both focus and grabs from history entry
- Ensures all grabbed ancestries are visible

### 3. Data Source Selection
Breadcrumbs component reads from UX.ts:
- **Ancestry mode**: Uses `ancestry_forDetails.heritage` (path from root)
- **History mode**: Uses `x.si_recents.items.map(item => item[0])` (focus history)

### 4. Grabs Preservation
Each history entry preserves the grabs state:
- When focus changes: `[ancestry, si_grabs]` saved
- When navigating history: grabs restored from entry
- Allows returning to previous selection state

## Implementation Details

### Layout Algorithm
`g.layout_breadcrumbs()` (Geometry.ts, lines 167-194):
1. Reverses ancestries to process from root outward
2. Calculates width for each ancestry based on `breadcrumb_title`
3. Accumulates widths until threshold exceeded
4. Centers if `centered` flag is true
5. Calculates left positions for each crumb
6. Returns filtered ancestries, widths, positions, and encoded counts

### Visibility Management
When navigating history via `ancestry_next_focusOn()`:
- Each grabbed ancestry calls `ancestry_assureIsVisible()` (line 92)
- Ensures graph view adjusts to show all grabbed items
- Maintains visual consistency when restoring history state

### Reactive Triggers
Breadcrumbs component updates when:
- Mode changes (`w_t_breadcrumbs`)
- Focus changes (`w_ancestry_forDetails`)
- History changes (`x.si_recents`)
- Grabs change (`x.si_grabs`)
- Window resizes (`w_rect_ofGraphView`)
- Search state changes (`w_s_search`)
- Title editing state changes (`w_s_title_edit`)

## Summary

The breadcrumbs system provides dual navigation modes:
- **Ancestry mode**: Shows hierarchical path from root to current
- **History mode**: Shows navigation history with preserved grab states

All three parts (selector, next/previous, crumb buttons) work together with UX.ts to maintain and navigate through the user's exploration history, preserving both focus and selection state at each navigation point.

## Index

### index

