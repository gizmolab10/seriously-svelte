# Hover Data Flow Analysis: Mouse Enter → Color Change

## Phase 1: Mouse Detection (Mouse_Responder.svelte)

<details>
<summary>1. Mouse enters Widget_Drag component</summary>

Lines 148-156 in `Mouse_Responder.svelte`:
- `Mouse_Responder` wraps the drag button with event listeners:
  - `on:mousemove={handle_hover}` (line 152)
  - `on:mouseleave={handle_hover}` (line 151)

</details>

<details>
<summary>2. `handle_hover()` function execution</summary>

Lines 90-109:
- Adds 5ms setTimeout delay for store synchronization
- Gets current mouse position from `$w_mouse_location` store
- Checks if mouse is over element using `Rect.rect_forElement_containsPoint()`
- Compares new hover state with current: `s_mouse.isHovering != isHit`

</details>

<details>
<summary>3. Hover state change detected</summary>

- Creates `S_Mouse.hover(null, bound_element, isHit)` object with `hover_didChange: true`
- Calls parent's `handle_s_mouse()` callback (line 102)

</details>

---

## Phase 2: Widget_Drag Processing

<details>
<summary>4. `handle_s_mouse()` in Widget_Drag.svelte</summary>

Lines 102-114:
- Receives S_Mouse object from Mouse_Responder
- Checks if hover state changed: `s_mouse.hover_didChange` (line 104)

</details>

<details>
<summary>5. Updates S_Element hover state</summary>

Line 105:
- Sets `s_drag.isHovering = s_mouse.isHovering`
- This triggers the `isHovering` setter in S_Element

</details>

---

## Phase 3: Global State Update (S_Element.ts)

<details>
<summary>6. S_Element `isHovering` setter</summary>

Lines 59-70:
```typescript
set isHovering(isHovering: boolean) {
    const old_hover = get(s.w_s_hover);
    const same = old_hover == this;
    let new_hover = isHovering ? this : this.s_widget;
    if (same != isHovering && new_hover != old_hover) {
        s.w_s_hover.set(new_hover);  // Updates global store
        if (!this.isADot) {
            debug.log_hover(`${isHovering ? '|' : '-'} set ${this.name}`);
        }
    }
}
```

</details>

---

## Phase 4: Reactive Color Computation

<details>
<summary>7. Widget_Drag reactive block triggered</summary>

Lines 52-60 in `Widget_Drag.svelte`:
```typescript
$: {
    const _ = `${$w_s_hover?.description ?? 'null'}`;  // subscribes to w_s_hover
    update_colors();
}
```
- Any change to `$w_s_hover` triggers this block
- Calls `update_colors()` function

</details>

<details>
<summary>8. `update_colors()` function</summary>

Lines 76-86:
```typescript
function update_colors() {
    if (!elements.isAny_rotation_active && !!s_drag && !!thing) {
        const usePointer = (!ancestry.isGrabbed || controls.inRadialMode) && ancestry.hasChildren;
        const cursor = usePointer ? 'pointer' : 'normal';
        color = thing.color;
        s_drag.set_forHovering(color, cursor);
        svg_outline_color = s_drag.svg_outline_color;
        fill_color = debug.lines ? 'transparent' : s_drag.fill;
        ellipsis_color = s_drag.stroke;
    }
}
```

</details>

---

## Phase 5: Color Property Computation (S_Element.ts)

<details>
<summary>9. Computed `fill` getter</summary>

Line 57:
```typescript
get fill(): string { 
    return this.isDisabled ? 'transparent' 
        : this.color_isInverted ? this.hoverColor 
        : this.isSelected ? 'lightblue' 
        : this.color_background;
}
```

</details>

<details>
<summary>10. Computed `stroke` getter</summary>

Line 54:
```typescript
get stroke(): string { 
    return this.isDisabled ? this.disabledTextColor 
        : this.color_isInverted ? this.color_background 
        : this.hoverColor;
}
```

</details>

<details>
<summary>11. `color_isInverted` getter</summary>

Line 49:
```typescript
get color_isInverted(): boolean { 
    return this.isInverted != this.isHovering;  // XOR logic
}
```

</details>

<details>
<summary>12. `isHovering` getter</summary>

Line 47:
```typescript
get isHovering(): boolean { 
    return get(s.w_s_hover) == this;  // Reads from global store
}
```

</details>

<details>
<summary>13. `svg_outline_color` getter</summary>

Lines 89-99:
```typescript
get svg_outline_color(): string {
    const thing_color = this.ancestry.thing?.color ?? k.empty;
    const isLight = colors.luminance_ofColor(thing_color) > 0.5;
    return (!this.ancestry.isGrabbed && !this.ancestry.isEditing)
        ? thing_color
        : (this.ancestry.isGrabbed && !this.ancestry.isEditing)
        ? this.color_background
        : isLight
        ? 'black'
        : this.hoverColor;
}
```

</details>

---

## Phase 6: SVG Rendering (Widget_Drag.svelte)

<details>
<summary>14. Svelte reactivity updates SVG</summary>

Lines 146-151:
```svelte
<SVG_D3 name={'svg-' + name}
    width={size}
    height={size}
    fill={fill_color}           ← Updated value
    stroke={svg_outline_color}  ← Updated value
    svgPath={svgPathFor_dragDot}/>
```

</details>

<details>
<summary>15. Graph.svelte reactive block</summary>

Lines 39-45 in `Graph.svelte`:
```typescript
$: {
    const _ = `${$w_s_hover?.description ?? 'null'}`;  // Also watches hover
    update_style();
}
```
- Graph component also reacts to hover changes for cursor updates

</details>

---

## Key Data Structures

<details>
<summary>S_Mouse object (created at hover)</summary>

```typescript
{
    hover_didChange: true,
    isHovering: true/false,
    event: null,
    element: bound_element
}
```

</details>

<details>
<summary>Global hover state</summary>

**Store**: `s.w_s_hover` (defined in `State.ts` line 35)
- **Type**: `S_Element | null`
- **Purpose**: Single source of truth for hover state across entire app

</details>

---

## Complete Flow Diagram

```
Mouse enters element
    ↓
Mouse_Responder.handle_hover() detects position
    ↓
Creates S_Mouse.hover() object
    ↓
Calls Widget_Drag.handle_s_mouse(s_mouse)
    ↓
Sets s_drag.isHovering = true
    ↓
S_Element.isHovering setter updates s.w_s_hover store
    ↓
Widget_Drag reactive block ($w_s_hover) fires
    ↓
Calls update_colors()
    ↓
Reads S_Element computed properties (fill, stroke, svg_outline_color)
    ↓
S_Element getters compute colors based on isHovering
    ↓
Svelte reactivity updates SVG_D3 component props
    ↓
Browser renders new colors
```

---

## Key Design Patterns

<details>
<summary>1. Dual Tracking</summary>

- **Local**: `S_Mouse` instance tracks hover per component
- **Global**: `w_s_hover` store tracks current hovered element app-wide

</details>

<details>
<summary>2. XOR Logic for Hover Inversion</summary>

```typescript
color_isInverted = isInverted XOR isHovering
```
Supports complex scenarios where hover appearance needs to be inverted (e.g., grabbed/editing states)

</details>

<details>
<summary>3. Delayed Detection</summary>

5ms setTimeout in `handle_hover()` ensures Svelte store updates have propagated before checking hover state

</details>

<details>
<summary>4. Reactive Chain</summary>

Single store update (`w_s_hover`) triggers reactive blocks across multiple components simultaneously

</details>

---

## File References

| Phase | Step | Purpose | File | Lines | Pattern |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 2-3 | Hover detection | `Mouse_Responder.svelte` | 90-109 | 3 |
| 2 | 4-5 | Hover handling | `Widget_Drag.svelte` | 102-114 | |
| 3 | 6 | Global state update | `S_Element.ts` | 59-70 | 1 |
| 3 | | Global hover store definition | `State.ts` | 35 | 1 |
| 4 | 7 | Reactive color updates | `Widget_Drag.svelte` | 52-60 | 4 |
| 4 | 8 | Color computation | `Widget_Drag.svelte` | 76-86 | |
| 5 | 9-12 | Color property getters | `S_Element.ts` | 47-57 | 2 |
| 5 | 13 | Outline color logic | `S_Element.ts` | 89-99 | |
| 6 | 15 | Graph-level hover reaction | `Graph.svelte` | 39-45 | 4 |
