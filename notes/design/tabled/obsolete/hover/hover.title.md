## Widget_Title Hover Flow Differences

<details>
<summary><strong>Phase 1: Mouse Detection</strong></summary>

### Standard Mouse_Responder
Lines 319-324:
- Uses `Mouse_Responder` component (same as template)
- Wraps both ghost `<span>` and `<input>` elements
- Width dynamically computed from `title_width`

### No explicit hover detection
- **Missing**: No `on:mousemove` or `on:mouseleave` handling
- **Missing**: No hover state change detection in `handle_s_mouse()`

</details>

<details>
<summary><strong>Phase 2: Widget Processing - MAJOR DIFFERENCES</strong></summary>

### Complex `handle_s_mouse()` function
Lines 244-265: **Completely different from template**

Instead of hover handling, manages:
1. **Text editing state** (lines 246-247)
   - Extracts selection range if already editing
2. **Edit stopping** (lines 249-252)
   - Stops previous edits before starting new ones
3. **Grabbing** (lines 253-254)
   - Grabs widget on mouse down (with shift-key support)
4. **Edit starting** (lines 255-262)
   - Starts editing when grabbed widget clicked again
   - Sets text selection range and focus

### No hover state updates
- **Missing**: Never calls `s_title.isHovering = s_mouse.isHovering`
- **Missing**: No `s_mouse.hover_didChange` check
- **Different**: Focus is on click/edit interaction, not hover

### Unused `isHit()` function
Line 37:
- Returns `false`
- Never called (no `handle_isHit` prop passed to Mouse_Responder)

</details>

<details>
<summary><strong>Phase 3: Global State Update</strong></summary>

### NO hover state updates
- **Missing**: Does not update `s.w_s_hover` store
- Widget_Title appears to not participate in global hover system

</details>

<details>
<summary><strong>Phase 4: Reactive Color Computation - DIFFERENT PATTERN</strong></summary>

### Reactive dependencies WITHOUT hover
Lines 80-92: Reacts to **3 stores** (does NOT include `$w_s_hover`):
- `$w_thing_color` - Thing color changes
- `$w_grabbed` - Grabbed state changes  
- `$w_expanded` - Expanded state changes

### No `update_colors()` function
**Missing**: No dedicated color update function

Instead:
- Line 76: `color = s_widget.colorFor_grabbed_andEditing(isGrabbed, isEditing)`
- Line 89: Same computation repeated
- **Different**: Color based on **grabbed/editing state**, NOT hover state

### Position updates (NOT in template)
Lines 87-88: Also updates `top` and `left` position
- Adjusts for grabbed state
- Adjusts for radial mode + focus

</details>

<details>
<summary><strong>Phase 5: Color Property Computation</strong></summary>

### Delegated to S_Widget
Lines 76, 89: Uses `s_widget.colorFor_grabbed_andEditing()`
- **Different**: Not using S_Element computed properties (`fill`, `stroke`, `svg_outline_color`)
- **Different**: Color computation delegated to parent S_Widget class

### No S_Element getters used
- **Missing**: Doesn't use `fill`, `stroke`, `color_isInverted`
- **Different**: Input element uses direct `color` CSS property (line 355)

</details>

<details>
<summary><strong>Phase 6: Rendering - HTML Input, Not SVG</strong></summary>

### HTML `<input>` element
Lines 336-366: **Completely different from SVG template**

Renders as:
- HTML `<input type='text'>` (not SVG)
- Direct CSS `color` property (line 355)
- No `fill` or `stroke` properties

### Cursor based on editing state
Line 366: 
```typescript
cursor: {isEditing() ? 'text' : 'pointer'}
```
- **Different**: Cursor changes with **editing state**, not hover state
- **Missing**: No hover-based cursor logic

### Ghost span for width measurement
Lines 325-335:
- Hidden `<span>` element mirrors input text
- Used to measure pixel width dynamically
- Updates `title_width` via `updateInputWidth()` (lines 269-273)

</details>

---

## Summary: Widget_Title Does NOT Follow Hover Template

| Aspect | Widget_Drag (Template) | Widget_Title |
|:---:|:---:|:---:|
| **Hover detection** | Explicit via `hover_didChange` | None |
| **Sets `isHovering`** | Yes | No |
| **Updates `w_s_hover`** | Yes | No |
| **Reacts to `$w_s_hover`** | Yes | No |
| **Color computation** | `update_colors()` → S_Element getters | `s_widget.colorFor_grabbed_andEditing()` |
| **Color depends on** | Hover state | Grabbed/editing state |
| **Cursor depends on** | Hover state | Editing state |
| **Main interaction** | Click to select/focus | Click to grab, double-click to edit |
| **Rendering** | SVG with fill/stroke | HTML input with CSS color |
| **Width** | Fixed (`k.height.dot`) | Dynamic (text measurement) |

### Key Insight
**Widget_Title uses Mouse_Responder for click/edit management, NOT for hover state.** It ignores the hover system entirely and relies on grabbed/editing states for visual changes.
