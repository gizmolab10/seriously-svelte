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
    return target?.handle_s_mouse?.(s_mouse) ?? false;
}
```

### S_Hit_Target.ts

```ts
get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button].includes(this.type); }
get isAWidget(): boolean { return [T_Hit_Target.widget, T_Hit_Target.title].includes(this.type); }
get isRing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }
```

### Component Pattern

Components register a handler when creating their `S_Element`:

```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
    // handle click, return true if consumed
    return closure(s_mouse);
};
```

Remove DOM handlers from component markup:

```diff
- on:pointerdown={handle_pointerDown}
- on:pointerup={handle_pointerUp}
```

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

### Pending

- [ ] `Search_Results.svelte` — complex (dynamic rows, may be too granular)

---

## Component Complexity

| Component | Complexity | Issue |
|-----------|------------|-------|
| `Rubberband.svelte` | Catch-all | Covers full graph, lowest priority — catches unhandled clicks |
| `Search_Results.svelte` | Dynamic | Each row would need its own S_Element — too granular |
| `Glow_Button.svelte` | Good fit | Reusable button, can add S_Element |
| `Next_Previous.svelte` | Multiple | Each button in the row needs its own S_Element |

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
    return true;
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

### Proposed Approach

Move autorepeat management into the centralized hit system:

1. **Add autorepeat properties to S_Hit_Target**:
   ```ts
   // In S_Hit_Target.ts
   autorepeat_callback?: () => void;
   autorepeat_id?: number;
   detect_autorepeat?: boolean;
   ```

2. **Centralized autorepeat management in Hits.ts**:
   ```ts
   // Track currently autorepeating target
   w_autorepeating_target = writable<S_Hit_Target | null>(null);
   
   // In handle_click_at, after calling handle_s_mouse:
   if (target.detect_autorepeat && s_mouse.isDown) {
       this.start_autorepeat(target);
   }
   if (s_mouse.isUp) {
       this.stop_autorepeat();
   }
   
   // In detect_hovering_at, when hover changes:
   if (get(this.w_autorepeating_target) && !target?.isEqualTo(get(this.w_autorepeating_target))) {
       this.stop_autorepeat();
   }
   ```

3. **Simplified component code**:
   ```ts
   // Component just sets properties
   s_element.detect_autorepeat = true;
   s_element.autorepeat_callback = () => closure();
   // No timer management needed!
   ```

### Benefits

- **Single source of truth**: Autorepeat logic in one place (Hits.ts)
- **Automatic hover leave handling**: Hits already tracks hover changes
- **Cleaner components**: Components just declare autorepeat, don't manage it
- **Consistent behavior**: All autorepeat works the same way
- **Easier debugging**: Can inspect `w_autorepeating_target` store

### Migration Steps

1. Add autorepeat properties to `S_Hit_Target`
2. Add autorepeat management methods to `Hits.ts`
3. Update `handle_click_at` to start/stop autorepeat
4. Update `detect_hovering_at` to stop on hover leave
5. Migrate components one by one:
   - Remove `Mouse_Timer` instance
   - Remove autorepeat start/stop calls
   - Remove hover leave reactive statements
   - Set `s_element.detect_autorepeat` and `autorepeat_callback`

### Components to Migrate

- [ ] `Glow_Button.svelte`
- [ ] `Button.svelte`
- [ ] `Next_Previous.svelte`
- [ ] `D_Actions.svelte` (conditional autorepeat)

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
