# Clicks Design

## Overview

Centralized click handling using the Hits spatial index to dispatch `handle_s_mouse` to the component under the mouse. Eliminates per-component DOM event handlers.

---

## Approach

### 1. Click Detection

On `mousedown`/`mouseup` at the document level (Events.ts):
- Call `hits.targets_atPoint(point)` to find targets under cursor
- Select topmost target using priority: dot → widget → ring → control → other
- Invoke `target.handle_s_mouse(s_mouse)` if defined
- If the chosen target has `detect_autorepeat` set, `Hits` starts/stops autorepeat centrally

### 2. S_Hit_Target Extension

Add optional `handle_s_mouse` method to `S_Hit_Target`:

```ts
handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
```

Components implement this method on their `S_Element` or `S_Component`.

### 3. Event Flow

```
mousedown → Events.ts → hits.handle_click_at(point, s_mouse)
                              ↓
                     targets_atPoint(point)
                              ↓
                     select topmost target
                              ↓
                     target.handle_s_mouse(s_mouse)
```

---

## Implementation

### Hits.ts

```ts
handle_click_at(point: Point, s_mouse: S_Mouse): boolean {
	const targets = this.targets_atPoint(point);
	// If meta key is held, force rubberband target (for graph dragging)
	if (s_mouse.event?.metaKey) {
		const rubberband_target = targets.find(s => s.type === T_Hit_Target.rubberband);
		if (rubberband_target) {
			return rubberband_target.handle_s_mouse?.(s_mouse) ?? false;
		}
	}
	const target
		=  targets.find(s => s.isADot)
		?? targets.find(s => s.isAWidget)
		?? targets.find(s => s.isRing)
		?? targets.find(s => s.isAControl)
		?? targets[0];

	// Call handle_s_mouse first to allow component to set up (e.g., capture event for autorepeat)
	const handled = target?.handle_s_mouse?.(s_mouse) ?? false;

	// Centralized autorepeat start/stop
	if (target?.detect_autorepeat && target?.autorepeat_callback) {
		if (s_mouse.isUp) {
			this.stop_autorepeat();
		} else if (s_mouse.isDown) {
			this.start_autorepeat(target);
		}
	}

	return handled;
}
```

### S_Hit_Target.ts

```ts
get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button].includes(this.type); }
get isAWidget(): boolean { return [T_Hit_Target.widget, T_Hit_Target.title].includes(this.type); }
get isRing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }
```

Hit rectangles for **graph elements** (dots, widgets, rings) are clipped to the visible graph view to avoid overlapping the controls/details UI:

```ts
update_rect() {
	if (!!this.html_element) {
		let rect = g.scaled_rect_forElement(this.html_element);
		// Clip graph elements (dots, widgets, rings) to graph bounds to prevent them from
		// extending outside and interfering with other UI elements (e.g., details panel buttons)
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

### Component Pattern

Components **register a handler on their hit target** and let `Hits` dispatch:

```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
	// handle click, return true if consumed
	return handle_s_mouse(s_mouse);
};
```

DOM `on:mouse*` handlers are removed from markup – only the centralized `Events.ts` listeners remain.

---

## Progress

### Done

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

### Pending

- [ ] `Search_Results.svelte` — complex (dynamic rows, may be too granular)

---

## Component Complexity

| Component | Complexity | Issue |
|-----------|------------|-------|
| `Rubberband.svelte` | Catch-all | Covers full graph, lowest priority — catches unhandled clicks |
| `Search_Results.svelte` | Dynamic | Each row would need its own S_Element — too granular |
| `Glow_Button.svelte` | Good fit | Reusable button, can add S_Element |
| `Next_Previous.svelte` | Multiple | Each button in the row needs its own S_Element; centralized autorepeat per button |
| `Breadcrumb_Button.svelte` | Dual state | Uses widget (`S_Widget`) for colors + separate `S_Element` hit target for the chip |

---

## Migration

### Step 1: Add S_Element (for components without one)

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

### Step 2: Set handle_s_mouse (for components with existing S_Element)

```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
	// move existing handler logic here
	return handle_s_mouse(s_mouse);
};
```

### Step 3: Remove DOM handlers

```diff
- on:pointerdown={handle_pointerDown}
- on:pointerup={handle_pointerUp}
```

---

### Components to migrate

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

---

## Autorepeat Current Situation

### How Autorepeat Works

Autorepeat allows buttons to repeatedly fire their action while held down. The current implementation is **per-component**:

1. **Timer Management**: Each component gets a `Mouse_Timer` instance via `e.mouse_timer_forName(name)`
2. **Start**: On `s_mouse.isDown`, component calls `mouse_timer.autorepeat_start(id, callback)`
   - Immediately calls `callback()` once
   - Waits `k.threshold.long_click` (default ~500ms)
   - Then starts interval calling `callback()` every `k.threshold.autorepeat` (default ~150ms)
3. **Stop**: On `s_mouse.isUp` or hover leave, component calls `mouse_timer.autorepeat_stop()`
4. **Visual Feedback**: Components check `mouse_timer.isAutorepeating_forID(id)` for CSS classes

### Current Components Using Autorepeat

| Component | Pattern | Notes |
|-----------|---------|-------|
| `Glow_Button.svelte` | `detect_autorepeat` prop | Stops on hover leave via reactive statement |
| `Button.svelte` | `detect_autorepeat` prop | Also supports `detect_longClick` |
| `Next_Previous.svelte` | Always enabled | Each button has its own ID (index) |
| `D_Actions.svelte` | Conditional | Only for `T_Action.browse` and `T_Action.move` |

### Current Implementation Pattern

```ts
// In component
const mouseTimer = e.mouse_timer_forName(`button-${name}`);

function handle_s_mouse(s_mouse: S_Mouse): boolean {
    if (s_mouse.isDown) {
        if (detect_autorepeat) {
            mouseTimer.autorepeat_start(0, () => {
                closure(); // or handle_click()
            });
        } else {
            closure();
        }
        return true;
    }
    if (s_mouse.isUp) {
        if (detect_autorepeat) {
            mouseTimer.autorepeat_stop();
        }
        return true;
    }
    return false;
}

// Stop on hover leave
$: if (!isHovering && detect_autorepeat) {
    mouseTimer.autorepeat_stop();
}
```

### Issues with Current Approach

1. **Duplication**: Every component with autorepeat has the same start/stop logic
2. **Hover Leave Handling**: Each component needs reactive statement to stop on hover leave
3. **Timer Lifecycle**: Components must manage timer cleanup
4. **Scattered Logic**: Autorepeat logic is mixed with click handling in each component

---

## Migrating Autorepeat into Hits

### Implementation Summary

**Status**: Infrastructure complete (Steps 1-4), `Glow_Button.svelte` migrated (Step 5)

**What Was Implemented**:
- ✅ Autorepeat properties added to `S_Hit_Target` (`detect_autorepeat`, `autorepeat_callback`, `autorepeat_id`)
- ✅ Centralized autorepeat management in `Hits.ts` with `w_autorepeating_target` store and timer
- ✅ Automatic start/stop on mouse down/up in `handle_click_at`
- ✅ Automatic stop on hover leave in `detect_hovering_at`
- ✅ `Glow_Button.svelte` successfully migrated as proof of concept

**Key Implementation Details**:
- Single `Mouse_Timer` instance in `Hits.ts` manages all autorepeat (replaces per-component timers)
- Components set properties on `S_Hit_Target` instead of managing timers directly
- `w_autorepeating_target` store enables components to check autorepeat state for visual feedback
- Hover leave detection automatically stops autorepeat when mouse leaves the target

### Implementation (Steps 1-4 Complete)

Autorepeat management has been moved into the centralized hit system:

1. **✅ Added autorepeat properties to S_Hit_Target**:
   ```ts
   // In S_Hit_Target.ts
   detect_autorepeat?: boolean;
   autorepeat_callback?: () => void;
   autorepeat_id?: number;
   ```

2. **✅ Centralized autorepeat management in Hits.ts**:
   ```ts
   // Track currently autorepeating target
   w_autorepeating_target = writable<S_Hit_Target | null>(null);
   autorepeat_timer: Mouse_Timer = new Mouse_Timer('hits-autorepeat');
   
   start_autorepeat(target: S_Hit_Target) {
       // Stops any existing autorepeat, sets target, starts timer
       // Mouse_Timer.autorepeat_start calls callback immediately, then starts interval
   }
   
   stop_autorepeat() {
       // Stops timer and clears autorepeating target
   }
   
   // In handle_click_at:
   if (s_mouse.isDown && target?.detect_autorepeat && target?.autorepeat_callback) {
       this.start_autorepeat(target);
   }
   if (s_mouse.isUp) {
       this.stop_autorepeat();
   }
   
   // In detect_hovering_at:
   const autorepeating_target = get(this.w_autorepeating_target);
   if (!!autorepeating_target && (!target || !target.isEqualTo(autorepeating_target))) {
       this.stop_autorepeat();
   }
   ```

3. **Simplified component code**:
   ```ts
   // Component just sets properties in onMount
   if (detect_autorepeat) {
       s_element.detect_autorepeat = true;
       s_element.autorepeat_callback = () => closure();
       s_element.autorepeat_id = 0;
   }
   // No Mouse_Timer instance needed!
   // No autorepeat start/stop calls needed!
   // No hover leave reactive statements needed!
   ```

### Benefits

- **Single source of truth**: Autorepeat logic in one place (Hits.ts)
- **Automatic hover leave handling**: Hits already tracks hover changes
- **Cleaner components**: Components just declare autorepeat, don't manage it
- **Consistent behavior**: All autorepeat works the same way
- **Easier debugging**: Can inspect `w_autorepeating_target` store

### Migration Steps

- [x] **Step 1**: Add autorepeat properties to `S_Hit_Target` ✅
- [x] **Step 2**: Add autorepeat management methods to `Hits.ts` ✅
- [x] **Step 3**: Update `handle_click_at` to start/stop autorepeat ✅
- [x] **Step 4**: Update `detect_hovering_at` to stop on hover leave ✅
- [ ] **Step 5**: Migrate components one by one:
   - Remove `Mouse_Timer` instance
   - Remove autorepeat start/stop calls
   - Remove hover leave reactive statements
   - Set `s_element.detect_autorepeat` and `autorepeat_callback`

### Components to Migrate

- [x] `Glow_Button.svelte` ✅ **Migrated**
- [x] `Button.svelte` ✅ **Migrated**
- [x] `Next_Previous.svelte` ✅ **Migrated**
- [ ] `D_Actions.svelte` (conditional autorepeat)

### Migration Risks by Component

#### `Glow_Button.svelte` — **Low Risk** ✅ **Migrated**

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

---

#### `Button.svelte` — **Medium Risk** ✅ **Migrated**

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

---

#### `Next_Previous.svelte` — **Medium-High Risk** ✅ **Migrated**

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

---

#### `D_Actions.svelte` — **High Risk**

---

#### `Breadcrumb_Button.svelte` — **Medium Risk** ✅ **Migrated**

**Role:**
- Presents a clickable breadcrumb chip in the controls strip for a widget’s ancestry.
- Needs to visually match the underlying widget while having its own hit target and geometry.

**Implementation:**
- Uses the widget’s `S_Widget` (`s_breadcrumb`) to compute colors:
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

**Status:**
- Not yet migrated to centralized autorepeat; still uses the existing conditional logic on top of the new `Button`/`Hits` infrastructure.

---

### Rubberband Migration

Rubberband handles clicks on "empty" graph space. Instead of Graph.svelte delegating to Rubberband, Rubberband registers directly as a catch-all hit target.

#### Why Rubberband, not Graph?

- Rubberband is the component that actually needs the click
- Graph just passes the event through — unnecessary middleman
- Rubberband already has `bounds` prop defining the hit area

#### Implementation (completed)

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

---

## Benefits

- Single point of click dispatch
- No per-component DOM event listeners for clicks
- Consistent priority ordering (dots > widgets > rings > controls > rubberband)
- Unified click and hover handling via Hits
- Centralized autorepeat management (future)
