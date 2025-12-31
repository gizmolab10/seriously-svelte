# Hits Design

Only one element in the app can react to the mouse. That's just plain sensible. The **Hits** spatial index knows which one. It's the **single source of truth** for hover, click, autorepeat, long-click, and double-click. Consistent behavior everywhere.

## Table of Contents
- [Overview & Status](#overview--status)
  - [Overview](#overview)
  - [Status](#status)
  - [Benefits](#benefits)
  - [Features](#features)
- [Architecture](#architecture)
  - [Core Concepts](#core-concepts)
  - [Click Detection Flow](#click-detection-flow)
  - [Event Flow Diagram](#event-flow-diagram)
  - [S_Hit_Target](#s_hit_target)
  - [Component Pattern](#component-pattern)
  - [S_Mouse](#s_mouse)
- [Centralized Timing System](#centralized-timing-system)
  - [T_Mouse_Detection Enum](#t_mouse_detection-enum)
  - [State Management](#state-management)
  - [Event Flow](#event-flow)
  - [Features](#features-1)
- [Migration Guide](#migration-guide)
  - [Migration Steps](#migration-steps)
  - [Component Status](#component-status)
- [Testing](#testing)
  - [Setup](#setup)
  - [Terms](#terms)
  - [Regression](#regression)
  - [Autorepeat](#autorepeat)
  - [Double-Click](#double-click)
  - [Long-Click](#long-click)
- [Reference](#reference)
  - [Risks & Mitigation](#risks--mitigation)
  - [Component Complexity](#component-complexity)

## Overview & Status

### Overview

Centralized click handling using the Hits spatial index to dispatch `handle_s_mouse` to the component under the mouse. Eliminates per-component DOM event handlers.

### Status

- [x] **Complete** - All mouse timing (autorepeat, long-click, double-click) and click counting are now centralized in `Hits.ts`
- [ ] Remaining work
	- [ ] **`Search_Results.svelte`** — complex (dynamic rows, may be too granular)
	- [ ] **breadcrumb button:**
	- Not yet migrated to centralized autorepeat; still uses the existing conditional logic on top of the new `Button`/`Hits` infrastructure.
	- [ ] **close button** does not yet use Button

### Benefits

- **Single source of truth**: clicks, hover, and all timing logic in one place (Hits.ts)
- **Automatic hover leave handling**: cancels autorepeat, long-click, and double-click timers when mouse leaves element
- **Cleaner components**: they declare (do not manage) autorepeat, long and double click
- **Consistent behavior**: all hovering and clicking works the same way
- **Consistent precedence:** dots > widgets > rings > controls > rubberband
- **Easier debugging**: Can inspect stores `w_autorepeat`, `w_longClick` to see active targets
- **Survives re-renders**: `autorepeat_event` and `autorepeat_isFirstCall` persist on `S_Hit_Target`

### Features

#### ✅ Autorepeat
- Centralized in `Hits` with `w_autorepeat` store and `autorepeat_timer`
- Components set `mouse_detection={T_Mouse_Detection.autorepeat}` and `autorepeat_callback`
- Automatic start/stop on mouse down/up and hover leave

#### ✅ Long-Click
- Centralized in `Hits` with `w_longClick` store, using `click_timer`
- Components set `mouse_detection` (includes `T_Mouse_Detection.long`) and `longClick_callback`
- Fires after ~500ms threshold, suppresses subsequent mouse-up click

#### ✅ Double-Click
- Centralized in `Hits` using `click_timer`
- Components set `mouse_detection` (includes `T_Mouse_Detection.double`) and `doubleClick_callback`
- Defers single-click ~200ms, fires double-click on second click within threshold

#### ✅ Click Counting
- Moved from `S_Mouse.clicks` (deprecated) to `S_Hit_Target.clicks`
- Centralized in `Hits` - increments on down, resets on up or double-click

#### ✅ T_Mouse_Detection Enum
- Replaces boolean flags (`detect_autorepeat`, `detect_longClick`, `detect_doubleClick`)
- Single `mouse_detection` property using bit flags
- Enforces mutual exclusivity (autorepeat incompatible with long/double-click)

---

## Architecture

### Core Concepts

#### Hits manager as Single Source of Truth

This manager is now the single point of truth regarding which (single!) element is reactive to hover and click. It uses the bounding rects of ALL registered elements to determine which one contains the current mouse position. It then calls handle_s_mouse on that element for mouse up and down events, and sets hits.w_s_hover for mouse entering or leaving the bounding rect.

Finally, some elements have a shape very different than a rectangle. S_Hit_Target provides an optional hook that can refine the enter/leave boundary.

#### Click Detection Flow

On `mousedown`/`mouseup` at the document level (Events.ts):
- Call `hits.targets_atPoint(point)` to find targets under cursor
- Select topmost target using priority: dot → widget → ring → control → other
- Invoke `target.handle_s_mouse(s_mouse)` if defined
- `Hits` handles all timing centrally:
  - If `detects_autorepeat` → starts/stops autorepeat
  - If `detects_longClick` → starts/cancels long-click timer
  - If `detects_doubleClick` → manages double-click detection and defers single-click
  - Increments/resets `target.clicks` for click counting

#### Event Flow Diagram

```
mousedown → Events.ts → hits.handle_click_at(point, s_mouse)
                              ↓
                     targets_atPoint(point)
                              ↓
                     select topmost target
                              ↓
                     target.handle_s_mouse(s_mouse)
```

### S_Hit_Target

The superclass of all element and component UX state objects (`S_Element` and `S_Component`). It has several parts: hit rect, handlers, state.
#### Hit Rect

Hits uses a highly performant index that can take a mouse position (x, y) and return a list of hit targets that enclose that point. To do this, each hit target is assigned a rect. Doing so registers it in the hits manager. The rect must be kept current, so it gets updated every time the graph is altered or details toggled, anything that shifts the position of a DOM element.
##### Registration

The `rect` setter now **always** calls `hits.add_hit_target(this)` unconditionally, without checking if the rect changed. This ensures targets are always registered/updated in the RBush, preventing unregistration issues during `recalibrate()`:
```ts
set rect(value: Rect | null) {
	this.element_rect = value;
	hits.add_hit_target(this);  // Always called, no "if changed" check
}
```
##### Clipping

Hit rectangles for **graph elements** (dots, widgets, rings) are clipped to the visible graph view to avoid overlapping the controls/details UI:
```ts
update_rect() {
	if (!!this.html_element) {
		let rect = g.scaled_rect_forElement(this.html_element);
		if (rect && (this.isADot || this.isAWidget || this.isRing)) {
			const graph_bounds = get(g.w_rect_ofGraphView);
			if (graph_bounds) {
				rect = rect.clippedTo(graph_bounds);
			}
		}
		this.rect = rect;
	}
}
```
#### Clicks

For all clicking (single, double, long and autorepeating), add optional `handle_s_mouse` method to `S_Hit_Target`:
```ts
handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
```
Svelte components and DOM elements implement this method on their `S_Element` or `S_Component`.
### Component Pattern

Components **register a handler on their hit target** and let `Hits` dispatch:
```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
	// handle click, return true if consumed
	return handle_s_mouse(s_mouse);
};
```
DOM `on:mouse*` handlers are removed from markup – only the centralized `Events.ts` listeners remain.
### S_Mouse

The `elements.s_mouse_forName(name)` pattern was a workaround to persist `clicks` across events. Once `Hits` owns click counting via `S_Hit_Target.clicks`, components can receive fresh `S_Mouse` instances each time — cleaner and stateless from the component's perspective.

The factories (`S_Mouse.long()`, `S_Mouse.double()`, etc.) become even more important since `Hits` will construct these when firing callbacks.

#### What `S_Mouse` Is

`S_Mouse` is a **transient value object** — a tidy clump that encapsulates current mouse-relevant information:

- **What happened**: `isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove`
- **Where**: `element` (the target HTMLElement)
- **Raw data**: `event` (the original MouseEvent, for coords, modifiers, etc.)

The static factories make construction semantic:

```ts
S_Mouse.down(event, element)    // user pressed
S_Mouse.up(event, element)       // user released
S_Mouse.long(event, element)     // held past threshold
S_Mouse.double(event, element)   // second click within threshold
S_Mouse.repeat(event, element)   // autorepeat tick
```

Components receive these and just ask `if (s_mouse.isLong)` — they don't care how the timing was detected.

#### What Stays

| `S_Mouse` role | Still needed? |
|----------------|---------------|
| Flags: `isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove` | ✅ Yes |
| Carries `event: MouseEvent` and `element: HTMLElement` | ✅ Yes |
| Static factories: `S_Mouse.down()`, `.up()`, `.long()`, `.double()`, `.repeat()` | ✅ Yes |
| Passed to `handle_s_mouse(s_mouse)` callbacks | ✅ Yes |

#### What Gets Deprecated

| Current pattern | Change |
|-----------------|--------|
| `elements.s_mouse_forName(name)` — persistent per-component instance | **Deprecated** — no longer needed |
| `S_Mouse.clicks` property mutated by Button | **Deprecated** — moves to `S_Hit_Target.clicks` |
| `detect_autorepeat` / `detect_longClick` boolean props | **Replaced** by `mouse_detection: T_Mouse_Detection` enum prop |
| `s_element.detect_autorepeat = true` direct assignment | **Replaced** by `s_element.mouse_detection = T_Mouse_Detection.autorepeat` |

---

## Centralized Timing System

### T_Mouse_Detection Enum

The `T_Mouse_Detection` enum (in `Enumerations.ts`) uses bit flags to define mouse interaction types:

```ts
export enum T_Mouse_Detection {
    autorepeat = 4,  // Mutually exclusive with others
    doubleLong = 3,  // double | long (can combine these two)
    double     = 1,
    long       = 2,
    none       = 0,
}
```

`S_Hit_Target` uses a single `mouse_detection` property instead of separate boolean flags:

```ts
// S_Hit_Target.ts
mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
longClick_callback?: (s_mouse: S_Mouse) => void;
doubleClick_callback?: (s_mouse: S_Mouse) => void;
clicks: number = 0;

// Getters for backward compatibility with Hits logic
get detects_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
get detects_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
```

Components pass `mouse_detection={T_Mouse_Detection.autorepeat}` instead of `detect_autorepeat={true}`.

### State Management

`Hits` manages centralized timing with:
- `w_longClick`: Store tracking the target currently waiting for long-click
- `w_autorepeat`: Store tracking the target currently autorepeating (renamed from `w_autorepeating_target`)
- `click_timer`: Single `Mouse_Timer` for long-click and double-click timing
- `autorepeat_timer`: Single `Mouse_Timer` for autorepeat operations
- `pending_singleClick_target`: Target with deferred single-click (for double-click detection)
- `pending_singleClick_event`: MouseEvent for deferred single-click
- `longClick_fired`: Flag to suppress mouse-up after long-click fires
- `doubleClick_fired`: Flag to suppress mouse-up after double-click timer expires and deferred single-click fires

### Event Flow

#### handle_click_at Flow

**On mouse down:**
- Increment `target.clicks`
- If `target.detects_longClick` → start long-click timer, store pending target/event
- If `target.detects_doubleClick`:
  - If second click within threshold → fire `doubleClick_callback`, cancel timer
  - If first click → start double-click timer, defer single-click
- If `target.detects_autorepeat` → start autorepeat
- If no special detection → fire `handle_s_mouse` immediately

**On mouse up:**
- Cancel long-click timer
- Stop autorepeat
- Reset `target.clicks`
- If long-click already fired or double-click timer already fired → suppress regular click
- Otherwise → fire `handle_s_mouse`

**When long-click timer fires:**
- Fire `longClick_callback` with `S_Mouse.long(...)`
- Set `longClick_fired` flag to suppress subsequent mouse-up

**When double-click timer expires:**
- User didn't click again → fire deferred single-click callback
- Reset `target.clicks`
- Set `doubleClick_fired` flag to suppress subsequent mouse-up click

#### Cleanup on Hover-Leave

In `detect_hovering_at`, cancel pending timers if mouse leaves the target:
- If hover leaves the autorepeating target → stop autorepeat
- If hover leaves the long-click target → cancel long-click timer
- If hover leaves the pending double-click target → cancel double-click timer

### Features

#### Autorepeat

**How Autorepeat Works:**

Autorepeat allows buttons to repeatedly fire their action while held down.

**Originally**, this was entirely **per-component**:

1. Each component got its own `Mouse_Timer` via `e.mouse_timer_forName(name)`.
2. On `s_mouse.isDown`, components called `mouse_timer.autorepeat_start(id, callback)`:
   - Immediately invoked `callback()` once.
   - Waited `k.threshold.long_click` (default ~500ms).
   - Then called `callback()` every `k.threshold.autorepeat` (default ~150ms).
3. On `s_mouse.isUp` or hover leave, components called `mouse_timer.autorepeat_stop()`.
4. Visual feedback was driven directly from `mouse_timer.isAutorepeating_forID(id)`.

**Now**, autorepeat timing is **centralized in `Hits`**:

1. `Hits` owns a single `Mouse_Timer` (`autorepeat_timer`) plus `w_autorepeat` store (renamed from `w_autorepeating_target`).
2. Components set properties on their `S_Hit_Target`:
   - `mouse_detection: T_Mouse_Detection` (set to `T_Mouse_Detection.autorepeat`)
   - `autorepeat_callback?: () => void`
   - `autorepeat_id?: number`
   - `autorepeat_event?: MouseEvent` (persists across component recreation)
   - `autorepeat_isFirstCall: boolean` (tracks if this is first call vs repeat)
3. In `Hits.handle_click_at`, after it has chosen a target and called its `handle_s_mouse`:
   - On `s_mouse.isDown` and when `detects_autorepeat`/`autorepeat_callback` are set, Hits calls `start_autorepeat(target)`.
   - On `s_mouse.isUp`, or when hover leaves the target in `detect_hovering_at`, Hits calls `stop_autorepeat()`.
4. Visual feedback comes from `w_autorepeat` store (components check `s_element.isEqualTo($w_autorepeat)`).

**Current Components Using Autorepeat:**

| Component | Pattern | Notes |
|-----------|---------|-------|
| `Glow_Button.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated |
| `Button.svelte` | `mouse_detection` prop | ✅ Migrated; supports `T_Mouse_Detection.autorepeat`, `T_Mouse_Detection.long`, `T_Mouse_Detection.double`, `T_Mouse_Detection.doubleLong` |
| `Next_Previous.svelte` | Always enabled | ✅ Migrated; each button has its own `S_Element` |
| `D_Actions.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated; all actions now autorepeat |
| `Steppers.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated; passed to `Triangle_Button` |

**Issues with Original Approach:**

1. **Duplication**: Every component with autorepeat had the same start/stop logic.
2. **Hover Leave Handling**: Each component needed its own reactive statement to stop on hover leave.
3. **Timer Lifecycle**: Components had to manage timer cleanup and conflicts.
4. **Scattered Logic**: Autorepeat logic was mixed with click handling in each component.

#### Long-Click

Long-click fires after a threshold (~500ms) and suppresses the subsequent mouse-up click. Centralized in `Hits` with `w_longClick` store, using `click_timer`.

#### Double-Click

Double-click defers single-click ~200ms, fires double-click on second click within threshold. Centralized in `Hits` using `click_timer`.

#### Click Counting

Moved from `S_Mouse.clicks` (deprecated) to `S_Hit_Target.clicks`. Centralized in `Hits` - increments on down, resets on up or double-click.

---

## Migration Guide

### Migration Steps

#### Step 1: Add S_Element (for components without one)

```ts
// in script block
const s_element = elements.s_element_for(new Identifiable(name), T_Hit_Target.button, name);
let element: HTMLElement;

onMount(() => {
    s_element.set_html_element(element);
    s_element.handle_s_mouse = handle_s_mouse;
});

onDestroy(() => {
    hits.delete_hit_target(s_element);
});
```

```svelte
<!-- bind element for hit rect -->
<div bind:this={element}>
    ...
</div>
```

#### Step 2: Set handle_s_mouse (for components with existing S_Element)

```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
	// move existing handler logic here
	return handle_s_mouse(s_mouse);
};
```

#### Step 3: Remove DOM handlers

```diff
- on:pointerdown={handle_pointerDown}
- on:pointerup={handle_pointerUp}
```

### Component Status

#### Components to Migrate

**Already have S_Element/S_Component (Step 2 + 3):**

| Component | Current Handlers | Status |
|-----------|------------------|--------|
| `Button.svelte` | `on:pointerdown`, `on:pointerup` | ✅ Done |
| `Widget_Title.svelte` | `on:pointerdown` | ✅ Done |
| `Radial_Rings.svelte` | `on:pointerdown` | ✅ Done |
| `Cluster_Pager.svelte` | `on:pointerup` | ✅ Done |

**Need S_Element added (Step 1 + 3):**

| Component | Current Handlers | Status |
|-----------|------------------|--------|
| `Search_Results.svelte` | `on:mousedown` | ⏳ Pending |

#### Migration Risks by Component

##### `Glow_Button.svelte` — **Low Risk** ✅ **Migrated**

**Previous Implementation:**
- Simple autorepeat pattern with `detect_autorepeat` prop
- Used reactive statement to stop on hover leave
- Visual feedback via `mouseTimer.isAutorepeating_forID(0)` for CSS class

**Migration Completed:**
- ✅ Removed `Mouse_Timer` instance and `e` import
- ✅ Removed autorepeat start/stop calls from `handle_s_mouse`
- ✅ Removed hover leave reactive statement
- ✅ Set `s_element.detect_autorepeat`, `autorepeat_callback`, and `autorepeat_id` in `onMount`
- ✅ Updated CSS class to use `w_autorepeating_target` store: `$: isAutorepeating = detect_autorepeat && s_element.isEqualTo($w_autorepeating_target)`

**Result:**
- Component code simplified from ~20 lines of autorepeat logic to 4 lines of property setup
- Visual feedback works correctly via centralized `w_autorepeating_target` store
- Hover leave handling works automatically through `Hits.detect_hovering_at`

##### `Button.svelte` — **Medium Risk** ✅ **Migrated**

**Components Using Button:**

**Direct Usage (render `<Button>`):**
- `Graph.svelte` — `T_Control.builds` button, `T_Control.help` button
- `D_Data.svelte` — "save to db" button
- `D_Actions.svelte` — "cancel" button
- `Primary_Controls.svelte` — "details-toggle", `T_Control.grow`, `T_Control.shrink`, "easter-egg" buttons
- `Search_Toggle.svelte` — Button usage (imported)

**Indirect Usage (via wrapper components):**
- `Buttons_Row.svelte` — Uses Button internally, renders multiple Button components in a row
  - Used by: `D_Data.svelte`, `D_Actions.svelte` (via `Buttons_Table`)
- `Buttons_Table.svelte` — Uses `Buttons_Row` (which uses Button)
  - Used by: `D_Actions.svelte`
- `Breadcrumb_Button.svelte` — Wraps Button for breadcrumb display
  - Used by: `Breadcrumbs.svelte`
- `Triangle_Button.svelte` — Wraps Button with triangle SVG styling
  - Used by: `Steppers.svelte`

**Current Implementation:**
- Supports both `detect_autorepeat` and `detect_longClick`
- Uses `S_Mouse.repeat()` vs `S_Mouse.down()` distinction in callback
- Tracks `s_mouse.clicks` for click counting
- Calls `recompute_style()` after each action
- Exposes a `handle_s_mouse` prop; internally wraps it in an `intercept_handle_s_mouse` that:
  - Captures the initial `MouseEvent` for autorepeat
  - Manages click counting and long-click timers
  - Delegates semantic behavior to the passed-in `handle_s_mouse`

**Risks:**
- **LongClick conflict**: LongClick uses same timer system but different logic — need to ensure they don't interfere
- **Repeat vs Down**: Callback receives `S_Mouse.repeat()` for autorepeat iterations, `S_Mouse.down()` for initial click — centralized system must preserve this distinction
- **Click counting**: `s_mouse.clicks` tracking may be affected if autorepeat changes event flow
- **Style recomputation**: Multiple rapid calls to `recompute_style()` during autorepeat — performance concern

**Mitigation:**
- LongClick should remain component-managed (not part of centralized autorepeat)
- Centralized autorepeat must call callback with `S_Mouse.repeat()` for iterations
- Preserve click counting logic separately from autorepeat
- Consider debouncing `recompute_style()` if performance issues arise

**Migration Completed:**
- ✅ Removed autorepeat start/stop calls from `handle_s_mouse`
- ✅ Set `s_button.detect_autorepeat`, `autorepeat_callback`, and `autorepeat_id` in a reactive block once `element` is bound
- ✅ Autorepeat callback distinguishes between initial down (`S_Mouse.down`) and repeats (`S_Mouse.repeat`) using `autorepeat_isFirstCall` flag
- ✅ Captures mouse event on mouse down for use in autorepeat callbacks
- ✅ LongClick handling remains component-managed (still uses `mouse_timer`)
- ✅ `reset()` function clears autorepeat state

**Result:**
- Autorepeat logic simplified - no manual timer management needed
- LongClick continues to work independently
- Click counting and style recomputation preserved
- Callers (`Graph.svelte`, `Buttons_Row.svelte`, `Buttons_Table.svelte`, `Breadcrumb_Button.svelte`, `Triangle_Button.svelte`, `Search_Toggle.svelte`, etc.) now pass a `handle_s_mouse` callback instead of a `closure`, which keeps control logic outside the generic button shell.

##### `Next_Previous.svelte` — **Medium-High Risk** ✅ **Migrated**

**Previous Implementation:**
- Multiple buttons (array) with a shared `Mouse_Timer` instance
- Each button used a different ID (index: 0, 1, 2) for `autorepeat_start(index, callback)`
- Single timer managed all buttons — stopping one stopped all
- Visual feedback per button via `mouseTimer.isAutorepeating_forID(index)`

**Migration Completed:**
- ✅ Each button gets its own `S_Element` hit target, created in `onMount`
- ✅ `s_element.handle_s_mouse` is set per index and delegates to a shared `handle_s_mouse(s_mouse, index)`
- ✅ `s_element.detect_autorepeat` is always `true` for these buttons
- ✅ `s_element.autorepeat_callback` calls the component `closure(index)` (no `S_Mouse` parameter needed)
- ✅ Mouse down captures the initial `MouseEvent` per index so repeats can be generated from it
- ✅ Mouse up clears the stored event, and centralized autorepeat in `Hits` handles timer lifecycle

**Result:**
- Autorepeat now uses the shared `Hits` timer instead of a local `Mouse_Timer`
- Each button can autorepeat independently, with hover leave handled centrally by `Hits.detect_hovering_at`

##### `D_Actions.svelte` — **High Risk**

**Current Implementation:**
- **Conditional autorepeat**: Only `T_Action.browse` and `T_Action.move` support autorepeat
- Uses `s_mouse.isRepeat` check inside callback: `if (s_mouse.isDown || (s_mouse.isRepeat && valid_autorepeat))`
- Autorepeat is enabled via `detect_autorepeat={true}` prop on `Buttons_Table`, but logic is conditional per action
- Other actions (add, delete, focus, etc.) should NOT autorepeat

**Risks:**
- **Conditional logic**: Cannot use simple `detect_autorepeat` flag — need runtime determination of which buttons should autorepeat
- **Action-specific**: Different buttons in same table have different autorepeat behavior — can't set at component level
- **Callback complexity**: Current callback (`handle_action_autorepeatAt`) checks action type and `isRepeat` — centralized system must preserve this logic
- **Breaking change**: If centralized system always autorepeats when enabled, other actions may incorrectly autorepeat

**Mitigation:**
- Add `autorepeat_callback` that can return `false` to prevent autorepeat for specific actions
- Or: Add `should_autorepeat?: (s_mouse: S_Mouse) => boolean` predicate to `S_Hit_Target`
- Or: Keep conditional logic in callback but ensure `S_Mouse.repeat()` is only sent for valid actions
- Test all action types to ensure only browse/move autorepeat

##### `Breadcrumb_Button.svelte` — **Medium Risk** ✅ **Migrated**

**Role:**
- Presents a clickable breadcrumb chip in the controls strip for a widget's ancestry.
- Needs to visually match the underlying widget while having its own hit target and geometry.

**Implementation:**
- Uses the widget's `S_Widget` (`s_breadcrumb`) to compute colors:
  - `s_breadcrumb.fill` → breadcrumb background
  - `s_breadcrumb.stroke` → breadcrumb text color
- Creates a separate `S_Element` hit target for the chip:
  - `s_element = elements.s_element_for(s_breadcrumb.ancestry, T_Hit_Target.button, title)`
  - Bound to the `Button.svelte` wrapper (`s_button={s_element}`)
  - `handle_s_mouse` in `Breadcrumb_Button.svelte` performs the ancestry focus/navigation
- Hover and hit-testing are driven by `s_element` (controls-strip coordinates), while color semantics come from `s_breadcrumb` (widget/ancestry state).

**Result:**
- Breadcrumb chips participate fully in the centralized hits/hover system.
- Visual state stays in sync with widget focus/grab/edit state without duplicating that logic in the controls layer.

#### Rubberband Migration

Rubberband handles clicks on "empty" graph space. Instead of Graph.svelte delegating to Rubberband, Rubberband registers directly as a catch-all hit target.

**Why Rubberband, not Graph?**

- Rubberband is the component that actually needs the click
- Graph just passes the event through — unnecessary middleman
- Rubberband already has `bounds` prop defining the hit area

**Implementation (completed):**

**Rubberband.svelte:**

```ts
const s_element = elements.s_element_for(new Identifiable('rubberband'), T_Hit_Target.rubberband, 'graph');
let rubberband_hit_area: HTMLElement;

onMount(() => {
    s_element.set_html_element(rubberband_hit_area);
    s_element.handle_s_mouse = handle_s_mouse;
});

onDestroy(() => {
    hits.delete_hit_target(s_element);
});

private function handle_s_mouse(s_mouse: S_Mouse): boolean {
    if (s_mouse.isDown && s_mouse.event) {
        const event = s_mouse.event;
        startPoint = new Point(event.clientX, event.clientY);
        if (event.metaKey) {
            $w_dragging = T_Drag.graph;
        } else {
            const constrained = constrainToRect(startPoint.x, startPoint.y);
            original_grab_count = x.si_grabs.items.length;
            rect.y = constrained.y;
            rect.x = constrained.x;
            $w_dragging = T_Drag.rubberband;
            rbush_forRubberband = hits.rbush_forRubberband;
        }
        return true;
    }
    return false;
}
```

Mouse up handler resets dragging for both rubberband and graph:

```ts
$: if ($w_count_mouse_up !== mouse_upCount) {
    mouse_upCount = $w_count_mouse_up;
    if ($w_dragging === T_Drag.graph) {
        startPoint = null;
        $w_dragging = T_Drag.none;
    } else if ($w_dragging === T_Drag.rubberband) {
        // ... rubberband cleanup ...
        $w_dragging = T_Drag.none;
    }
}
```

Hit area div:

```svelte
<div class='rubberband-hit-area' bind:this={rubberband_hit_area}
     style='position:absolute; top:0; left:0; width:{bounds.size.width}px; height:{bounds.size.height}px; pointer-events:none;'/>
```

CSS to prevent text selection during rubberbanding:

```css
:global(body.rubberband-blocking) {
    cursor: crosshair !important;
    user-select: none !important;
}
```

**Graph.svelte:**

Removed `on:mousedown={handle_mouseDown}` and `handle_mouseDown` function entirely.

**Enumerations.ts:**

Added `T_Hit_Target.rubberband`.

### Progress Tracking

#### Infrastructure ✅

- [x] Core infrastructure: `S_Hit_Target.handle_s_mouse`, `Hits.handle_click_at`, `Events.ts` integration
- [x] Priority chain: dot → widget → ring → control → catch-all
- [x] `isAControl` getter for T_Hit_Target.control and T_Hit_Target.button
- [x] `isAWidget` getter includes T_Hit_Target.title
- [x] `isRing` getter includes T_Hit_Target.paging
- [x] Meta key handling: forces rubberband target for graph dragging
- [x] `Glow_Button.svelte` — migrated (S_Element + handle_s_mouse + hover via hits)
- [x] `Next_Previous.svelte` — migrated (array of S_Elements for multiple buttons)
- [x] `Button.svelte` — migrated (S_Element + handle_s_mouse, supports autorepeat/longClick)
- [x] `Widget_Title.svelte` — migrated (s_title + s_widget handle_s_mouse)
- [x] `Radial_Rings.svelte` — migrated (s_rotation + s_resizing handle_s_mouse, paging handled in Radial_Cluster)
- [x] `Cluster_Pager.svelte` — migrated (s_pager handle_s_mouse for thumbs)
- [x] `Radial_Cluster.svelte` — migrated (s_paging handle_s_mouse for paging arcs)
- [x] `Rubberband.svelte` — migrated (catch-all for empty graph space, replaces Graph.svelte mousedown)
- [x] `Graph.svelte` — removed mousedown handler, Rubberband handles directly
- [x] Graph dragging (meta key) — stops on mouse up
- [x] Focus prevention: `focus({ preventScroll: true })` to prevent graph shifting during title editing
- [x] Hit-rect clipping for graph elements (dots/widgets/rings) to `g.w_rect_ofGraphView`

#### Migration Steps ✅

- [x] **Step 1**: Add autorepeat properties to `S_Hit_Target` ✅
- [x] **Step 2**: Add autorepeat management methods to `Hits.ts` ✅
- [x] **Step 3**: Update `handle_click_at` to start/stop autorepeat ✅
- [x] **Step 4**: Update `detect_hovering_at` to stop on hover leave ✅
- [x] **Step 5**: Migrate components one by one:
   - Remove `Mouse_Timer` instance
   - Remove autorepeat start/stop calls
   - Remove hover leave reactive statements
   - Set `s_element.detect_autorepeat` and `autorepeat_callback`

#### Components Migrated ✅

- [x] `Glow_Button.svelte` ✅ **Migrated**
- [x] `Button.svelte` ✅ **Migrated**
- [x] `Next_Previous.svelte` ✅ **Migrated**
- [x] `D_Actions.svelte` ✅ **Migrated**
- [x] `Steppers.svelte` ✅ **Migrated**
- [x] `Triangle_Button.svelte` ✅ **Migrated**
- [x] `Buttons_Row.svelte` ✅ **Migrated**
- [x] `Buttons_Table.svelte` ✅ **Migrated**
- [x] `Close_Button.svelte` ✅ **Migrated** (Fixed handler setup and RBush entry management)
- [x] `Widget_Drag.svelte` ✅ **Migrated** (Changed to respond on `isDown`, removed `w_count_mouse_up` mechanism)
- [x] `Widget_Reveal.svelte` ✅ **Migrated** (Changed to respond on `isDown`, removed `w_count_mouse_up` mechanism)
- [x] `Segmented.svelte` ✅ **Migrated** (Changed to `on:mousedown` for immediate response)
- [x] `Breadcrumb_Button.svelte` ✅ **Migrated** (Changed to respond on `isDown`)

#### Cleanup

- [x] **`S_Mouse.clicks`** — ✅ Reviewed: No longer used anywhere; **can be removed** from `S_Mouse` class
- [x] **`clicks.md` design doc** — ✅ Updated to reflect centralized model
- [x] **`Events.mouse_timer_forName()` and `mouse_timer_dict_byName`** — ✅ Reviewed: **Keep** — Still needed for non-click-timing uses:
  - Used by `Events.alterationTimer` for alteration blinking (not mouse click timing)
  - Used by `Radial_Rings.svelte` for reset on mouse up (radial-specific, not click timing)
- [x] **`Events.alterationTimer`** — ✅ Reviewed: **Keep** — Used for alteration visual feedback, not mouse click timing
- [x] **`Radial_Rings.svelte`** — ✅ Reviewed: **Keep** `e.mouse_timer_forName(name).reset()` — Used for radial ring state reset on mouse up, not click timing

---

## Testing

### Setup

All tests assume a **widget is selected** in the graph or (search results) list view. Without a selection, actions do not appear as only one of them makes sense (center the graph, tbd later).

### Terms

| Term | Definition |
|------|------------|
| **details panel** | A stack of buttons, each of which opens a panel. To show this stack, tap the details toggle (three horizontal bars, at top left). |
| **actions panel** | The details panel showing action buttons in seven categories (browse, focus, show, center, add, delete, move). |
| **browse action** | One of the four directional actions (left, up, down, right) in the top row. Changes selection to an adjacent widget. |
| **browse-down** | Selects the next sibling below the current selection. |
| **re-render** | When Svelte destroys and recreates a component (e.g., after selection changes). The `S_Hit_Target` persists but the component instance is new. |
| **steppers** | Up/down triangle buttons used to increment/decrement numeric values (e.g., in settings or property editors). |

### Regression

1. **Normal-click** buttons work normally
   - [x] Verify: single click works, no unexpected delays or repeats
   - [x] breadcrumbs — delay (fixed: now responds on `isDown`)
   - [x] details toggle — delay (fixed: now responds on `isDown`)
   - [x] search — ignored (fixed: handler setup improved)
   - [x] close search — ignored (fixed: handler setup improved, removed stale RBush entries)
   - [x] widget drag button — delay (fixed: now responds on `isDown`)
   - [x] widget reveal button — delay (fixed: now responds on `isDown`)
   - [x] all segmented controls (eg, tree/radial) — delay (fixed: changed to `on:mousedown`)

### Autorepeat

2. **Basic autorepeat, proof that works across UI re-render**
   - [x] Open actions panel
   - [x] Press and **hold** a browse action (try down)
   - [x] Verify:
     - [x] first action (change the selection) → fires immediately
     - [x] then → repeats after a short delay
     - [x] when the mouse is released → repeating stops
   - [x] **Verify across re-render**: Selection changes cause UI re-render, but autorepeat continues (thanks to `autorepeat_event` and `autorepeat_isFirstCall` persisting on `S_Hit_Target`)

3. **Hover-leave cancels autorepeat**
   - [x] Same as 2, above, press and hold a browse action
   - [x] While holding, drag mouse off the button
   - [x] Verify: autorepeat stops immediately
   - [x] **Fixed**: Added `user-select: none` to prevent text selection during drag

4. **Steppers autorepeat**
   - [x] Click on the build button, bottom left of graph
   - [x] The build notes will pop up
   - [x] The steppers are at the upper left
   - [x] Press and hold the downward pointing button
   - [x] Verify: value increments/decrements repeatedly

### Double-Click

5. **Double-click fires on second click**
   - [ ] Find a button with `mouse_detection = T_Mouse_Detection.double`
   - [ ] Click twice quickly (within ~300ms)
   - [ ] Verify: double-click callback fires, single-click does not

6. **Single-click deferred then fires**
   - [ ] Click once, wait for threshold to expire
   - [ ] Verify: single-click callback fires after delay

7. **Hover-leave cancels pending double-click**
   - [ ] Click once, immediately move mouse off button
   - [ ] Verify: pending single-click is cancelled

### Long-Click

8. **Long-click fires after threshold**
   - [ ] Find a button with `mouse_detection = T_Mouse_Detection.long` (TBD which component uses this)
   - [ ] Press and hold past threshold (~500ms)
   - [ ] Verify: long-click callback fires

9. **Long-click suppresses regular click**
   - [ ] After long-click fires (step 8), release mouse
   - [ ] Verify: no additional click action fires on release

10. **Early release prevents long-click**
    - [ ] Press button, release before threshold
    - [ ] Verify: normal click fires, not long-click

11. **Hover-leave cancels long-click timer**
    - [ ] Press and hold, drag off button before threshold
    - [ ] Verify: long-click does not fire

---

## Reference

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Long-click cancels single-click** | If long-click fires, subsequent mouse-up shouldn't trigger another callback | Set a `longClick_fired` flag, check in mouse-up handler |
| **Double-click delays single-click** | ~200ms delay for single-click when `detects_doubleClick` is enabled | Make this opt-in per target; document the tradeoff |
| **Click counting conflicts** | Components may still expect per-component `S_Mouse.clicks` | Migrate all click counting to `S_Hit_Target.clicks`; deprecate `S_Mouse.clicks` |
| **Timer conflicts** | Multiple targets with overlapping timers could interfere | Each timer tracks which target it belongs to; cancel on target change |
| **Hover-leave edge cases** | User presses, moves off target, releases elsewhere | Cancel pending timers in `detect_hovering_at`; suppress callbacks |
| **Autorepeat incompatible with long-click and double-click** | Autorepeat fires immediately and repeatedly; long-click waits then fires once; double-click defers first click. These are mutually exclusive behaviors. | **Enforced via `T_Mouse_Detection` enum.** `autorepeat = 4` cannot be combined with `double = 1` or `long = 2`. Only `doubleLong = 3` allows combining double and long. |

### Component Complexity

| Component | Complexity | Issue |
|-----------|------------|-------|
| `Rubberband.svelte` | Catch-all | Covers full graph, lowest priority — catches unhandled clicks |
| `Search_Results.svelte` | Dynamic | Each row would need its own S_Element — too granular |
| `Glow_Button.svelte` | Good fit | Reusable button, can add S_Element |
| `Next_Previous.svelte` | Multiple | Each button in the row needs its own S_Element; centralized autorepeat per button |
| `Breadcrumb_Button.svelte` | Dual state | Uses widget (`S_Widget`) for colors + separate `S_Element` hit target for the chip |
