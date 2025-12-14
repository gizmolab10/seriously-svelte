# Clicks Design

## Overview

Centralized click handling using the Hits spatial index to dispatch `handle_click` to the component under the mouse. Eliminates per-component DOM event handlers.

---

## Approach

### 1. Click Detection

On `pointerdown`/`pointerup` at the document level (Events.ts):
- Call `hits.targets_atPoint(point)` to find targets under cursor
- Select topmost target using priority: dot → widget → ring → other
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
        ?? targets[0];
    return target?.handle_click?.(s_mouse) ?? false;
}
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
- [x] `Glow_Button.svelte` — migrated (S_Element + handle_click + hover via hits)
- [x] `Next_Previous.svelte` — migrated (array of S_Elements for multiple buttons)

### Pending

- [ ] `Button.svelte`
- [ ] `Widget_Title.svelte`
- [ ] `Radial_Rings.svelte`
- [ ] `Cluster_Pager.svelte`
- [ ] `Rubberband.svelte` (replaces Graph.svelte mousedown)
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

## Rubberband Migration

Rubberband handles clicks on "empty" graph space. Instead of Graph.svelte delegating to Rubberband, Rubberband registers directly as a catch-all hit target.

### Why Rubberband, not Graph?

- Rubberband is the component that actually needs the click
- Graph just passes the event through — unnecessary middleman
- Rubberband already has `bounds` prop defining the hit area

### Current behavior (in Graph.svelte)

```ts
function handle_mouseDown(event: MouseEvent) {
    if (!target.closest('button, input, .widget, .mouse-responder')) {
        rubberbandComponent.handleMouseDown(event);
    }
}
```

### Migration strategy

1. **Add S_Element to Rubberband** — covers full `bounds` rect
2. **Lowest priority** — hit selection falls through: dot → widget → ring → rubberband
3. **handle_click starts rubberband** — moves logic from `handleMouseDown` export
4. **Remove Graph.svelte mousedown** — no longer needed

### Implementation

**Rubberband.svelte:**

```ts
const s_element = elements.s_element_for(new Identifiable('rubberband'), T_Hit_Target.rubberband, 'graph');
let rubberband_element: HTMLElement;

onMount(() => {
    s_element.set_html_element(rubberband_element);
    s_element.handle_click = (s_mouse: S_Mouse): boolean => {
        if (s_mouse.isDown && s_mouse.event) {
            const e = s_mouse.event;
            startPoint = new Point(e.clientX, e.clientY);
            if (e.metaKey) {
                $w_dragging = T_Drag.graph;
            } else if (!hits.isHovering) {
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
    };
});

onDestroy(() => {
    hits.delete_hit_target(s_element);
});
```

Add wrapper div binding:

```svelte
<div class='rubberband-hit-area' bind:this={rubberband_element} 
     style='position:absolute; top:0; left:0; width:{bounds.width}px; height:{bounds.height}px; pointer-events:none;'/>
```

**Graph.svelte:**

```diff
- on:mousedown={handle_mouseDown}
```

Remove `handle_mouseDown` function entirely.

**Enumerations.ts** — add new hit target type:

```ts
T_Hit_Target.rubberband
```

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
| `Rubberband.svelte` | (takes over from Graph.svelte) |
| `Search_Results.svelte` | `on:mousedown` |

---

## Benefits

- Single point of click dispatch
- No per-component DOM event listeners for clicks
- Consistent priority ordering (dots > widgets > rings > rubberband)
- Unified click and hover handling via Hits
