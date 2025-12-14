# Clicks Design

## Overview

Centralized click handling using the Hits spatial index to dispatch `handle_click` to the component under the mouse. Eliminates per-component DOM event handlers.

---

## Approach

### 1. Click Detection

On `pointerdown`/`pointerup` at the document level (Events.ts):
- Call `hits.targets_atPoint(point)` to find targets under cursor
- Select topmost target using priority: dot → widget → ring → control → other
- Invoke `target.handle_click(s_mouse)` if defined

### 2. S_Hit_Target Extension

Add optional `handle_click` method to `S_Hit_Target`:

```ts
handle_click?: (s_mouse: S_Mouse) => boolean;
```

Components implement this method on their `S_Element` or `S_Component`.

### 3. Event Flow

```
pointerdown → Events.ts → hits.handle_click_at(point, s_mouse)
                              ↓
                     targets_atPoint(point)
                              ↓
                     select topmost target
                              ↓
                     target.handle_click(s_mouse)
```

---

## Implementation

### Hits.ts

```ts
handle_click_at(point: Point, s_mouse: S_Mouse): boolean {
    const targets = this.targets_atPoint(point);
    const target
        =  targets.find(s => s.isADot)
        ?? targets.find(s => s.isAWidget)
        ?? targets.find(s => s.isRing)
        ?? targets.find(s => s.isAControl)
        ?? targets[0];
    return target?.handle_click?.(s_mouse) ?? false;
}
```

### S_Hit_Target.ts

```ts
get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button].includes(this.type); }
```

### Component Pattern

Components register a handler when creating their `S_Element`:

```ts
s_element.handle_click = (s_mouse: S_Mouse): boolean => {
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

- [x] Core infrastructure: `S_Hit_Target.handle_click`, `Hits.handle_click_at`, `Events.ts` integration
- [x] Priority chain: dot → widget → ring → control → catch-all
- [x] `isAControl` getter for T_Hit_Target.control and T_Hit_Target.button
- [x] `Glow_Button.svelte` — migrated (S_Element + handle_click + hover via hits)
- [x] `Next_Previous.svelte` — migrated (array of S_Elements for multiple buttons)
- [x] `Rubberband.svelte` — migrated (catch-all for empty graph space, replaces Graph.svelte mousedown)
- [x] `Graph.svelte` — removed mousedown handler, Rubberband handles directly
- [x] Graph dragging (meta key) — stops on mouse up

### Pending

- [ ] `Button.svelte`
- [ ] `Widget_Title.svelte`
- [ ] `Radial_Rings.svelte`
- [ ] `Cluster_Pager.svelte`
- [ ] `Search_Results.svelte`

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
    s_element.handle_click = (s_mouse: S_Mouse): boolean => {
        // move existing handler logic here
        return true;
    };
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

### Step 2: Set handle_click (for components with existing S_Element)

```ts
s_element.handle_click = (s_mouse: S_Mouse): boolean => {
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

| Component | Current Handlers |
|-----------|------------------|
| `Button.svelte` | `on:pointerdown`, `on:pointerup` |
| `Widget_Title.svelte` | `on:pointerdown` |
| `Radial_Rings.svelte` | `on:pointerdown` |
| `Cluster_Pager.svelte` | `on:pointerup` |

**Need S_Element added (Step 1 + 3):**

| Component | Current Handlers |
|-----------|------------------|
| `Search_Results.svelte` | `on:mousedown` |

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
    s_element.handle_click = handle_s_mouse;
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
