## Widget Hover Flow Differences

<details>
<summary><strong>Phase 1: Mouse Detection</strong></summary>

### Standard Mouse_Responder
Lines 161-173:
- Uses `Mouse_Responder` component (same as template)
- Wraps entire widget background container
- Width and height cover full widget area
- **Different**: Empty `<Mouse_Responder>` - no child content, just position

</details>

<details>
<summary><strong>Phase 2: Widget Processing - Simplified</strong></summary>

### Simple `handle_s_mouse()` function
Lines 123-129: **Simpler than template**

```typescript
function handle_s_mouse(s_mouse: S_Mouse) {
    if (!!ancestry && s_mouse.hover_didChange) {
        s_widget.isHovering = s_mouse.isHovering;
        debug.log_hover(`${s_widget.isHovering ? '|' : '-'}  W  ${s_widget.name}`);
        update_style();
    }
}
```

- **Same as template**: Checks `s_mouse.hover_didChange`
- **Same as template**: Sets `isHovering` on element (s_widget)
- **Same as template**: Calls style update function
- **Missing**: No rotation check (`elements.isAny_rotation_active`)
- **Missing**: No click handling (only hover)
- **Added**: Debug logging with "W" prefix for widget

### Click handled separately
Lines 101-104: `handle_click_event()`
- Grabs ancestry with shift-key support
- **Different**: Click and hover are separate handlers

</details>

<details>
<summary><strong>Phase 3: Global State Update</strong></summary>

### Standard `isHovering` setter
Line 125: `s_widget.isHovering = s_mouse.isHovering`
- **Same as template**: Uses S_Element setter (s_widget extends S_Element)
- **Same as template**: Updates `s.w_s_hover` store via setter

</details>

<details>
<summary><strong>Phase 4: Reactive Color Computation</strong></summary>

### Reactive dependencies
Lines 64-69: Subscribes to **3 stores**:
- `$w_thing_color` - Thing color changes
- `$w_s_hover` - Hover state changes ✓ (same as template)
- `$w_ancestry_focus` - Focus changes

```typescript
$: {
    const _ = `${$w_thing_color}
        :::${$w_s_hover?.description ?? 'null'}
        :::${$w_ancestry_focus.id}`;
    update_style();
}
```

### Direct `update_style()` call
Lines 131-143:
- **Different**: No separate `update_colors()` function
- **Different**: Combines layout and style updates
- **Simpler**: Single function for all visual updates

</details>

<details>
<summary><strong>Phase 5: Property Computation - S_Widget</strong></summary>

### Uses S_Widget computed properties
Lines 137-139:
```typescript
${s_widget.background};
color : ${s_widget.color};
border : ${s_widget.border};
```

- **Different**: Uses S_Widget class (extends S_Element with additional properties)
- **Different**: Uses `background`, `color`, `border` instead of `fill`, `stroke`
- **Note**: S_Widget computes these based on grabbed/editing/focus states

### S_Widget vs S_Element
- Widget_Drag uses: `s_drag` (S_Element)
- Widget uses: `s_widget` (S_Widget extends S_Element)
- S_Widget adds: `background`, `border` getters for widget container

</details>

<details>
<summary><strong>Phase 6: Rendering - HTML Container</strong></summary>

### HTML `<div>` background container
Lines 161-173: **Empty Mouse_Responder (just positioning)**
- Invisible background element for hover detection
- All visual content rendered separately in child div

### Separate visual content div
Lines 174-193:
```svelte
<div class='widget-content' style='...'>
    <Widget_Drag s_drag={s_drag}/>
    <Widget_Title s_title={s_title}/>
    <Widget_Reveal s_reveal={s_reveal}/>
</div>
```

- **Different**: Container component, not leaf component
- **Different**: Renders background/border, children render content
- **Different**: HTML div with CSS, not SVG
- **Architecture**: Widget is parent container; Drag/Title/Reveal are children

### CSS Style properties
Lines 132-142:
- `background` - Computed from `s_widget.background`
- `color` - Text color from `s_widget.color`
- `border` - Border style from `s_widget.border`
- **Different**: No `fill`, `stroke`, or SVG properties

</details>

---

## Summary: Widget as Container Component

| Aspect | Widget_Drag (Template) | Widget (Container) |
|:---:|:---:|:---:|
| **Role** | Leaf component (drag dot) | Container component (background) |
| **Hover detection** | Yes, on drag dot | Yes, on whole widget |
| **Sets `isHovering`** | Yes (`s_drag`) | Yes (`s_widget`) |
| **Updates `w_s_hover`** | Yes | Yes |
| **Reacts to `$w_s_hover`** | Yes | Yes |
| **S_Element class** | S_Element | S_Widget (extends S_Element) |
| **Visual properties** | `fill`, `stroke`, `svg_outline_color` | `background`, `color`, `border` |
| **Rendering** | SVG with `SVG_D3` | HTML div with CSS |
| **Click handler** | In `handle_s_mouse()` | Separate `handle_click_event()` |
| **Child components** | None (ellipses, related dots inline) | Widget_Drag, Widget_Title, Widget_Reveal |
| **Reactive stores** | 6 (includes grabbed, forDetails) | 3 (thing_color, hover, focus) |
| **Complexity** | Medium (multiple SVG paths) | Simple (container only) |

### Key Insights

1. **Widget is a container**: Provides hover-sensitive background; children handle their own interactions
2. **Hover hierarchy**: Widget hover affects background/border; child components (Drag, Reveal) have independent hover states
3. **S_Widget properties**: Adds `background` and `border` getters specifically for container styling
4. **Separation of concerns**: Hover detection in container, content rendering in children
5. **Two-layer rendering**: Empty Mouse_Responder for hover + separate div for visual content

### Architecture Pattern
```
Widget (container - hover + background)
  ├─ Widget_Drag (drag dot - own hover)
  ├─ Widget_Title (title input - no hover)
  └─ Widget_Reveal (reveal dot - own hover)
```
Each component can be hovered independently, but Widget provides the unified background container.
