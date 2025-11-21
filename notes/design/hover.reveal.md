## Widget_Reveal Hover Flow Differences

<details>
<summary><strong>Phase 2: Widget Processing</strong></summary>

### Simpler `handle_s_mouse()`
Lines 78-85:
- **Missing**: No rotation check (`elements.isAny_rotation_active`)
- **Different click action**: Toggles expansion (`h.ancestry_toggle_expansion`) instead of `e.handle_singleClick_onDragDot`
- **No shift-key handling**: Widget_Drag checks `shiftKey`, Widget_Reveal doesn't

### Unused `isHit()` function
Lines 87-89:
- Returns `false` 
- Never called by Mouse_Responder (no `handle_isHit` prop passed)

</details>

<details>
<summary><strong>Phase 4: Reactive Color Computation</strong></summary>

### More reactive dependencies
Lines 44-54: Subscribes to **7 stores** instead of 6:
- **Added**: `$w_grabbed`, `$w_expanded`, `$w_thing_title`
- **Same as template**: `$w_s_hover`, `$w_background_color`, `$w_thing_color`

### Dual function calls
- Calls **both** `update_svgPaths()` AND `update_colors()` (template only calls colors)

### Simpler `update_colors()` function
Lines 58-65:
- **Missing**: No rotation check
- **Missing**: No dynamic cursor logic (always hardcoded to `'pointer'`)
- **Missing**: No conditional pointer based on grabbed/radialMode/hasChildren
- **Added**: Debug logging for inverted state (line 64)

</details>

<details>
<summary><strong>Phase 5: SVG Path Updates (NEW PHASE)</strong></summary>

### `update_svgPaths()` function
Lines 67-76: **Not present in Widget_Drag template**

Computes three SVG paths:
- `svgPathFor_revealDot` - Main dot shape
- `svgPathFor_tiny_outer_dots` - Children indicator dots
- `svgPathFor_fat_center_dot` - Bulk alias / depth limit indicator

Triggered by same reactive block as colors

</details>

<details>
<summary><strong>Phase 6: SVG Rendering</strong></summary>

### Multiple SVG elements
Lines 106-151: **3 conditional SVG components** instead of 1:

1. **Main reveal dot** (always rendered)
   - Lines 106-111
   - Uses `SVG_D3` component

2. **Fat center dot** (conditional)
   - Lines 112-127
   - Shown if `isBulkAlias` OR `hidden_by_depth_limit`
   - Uses `bulkAlias_color` for both stroke and fill

3. **Tiny outer dots** (conditional)
   - Lines 128-149
   - Shown if children exist
   - Uses raw `<svg><path>` instead of `SVG_D3` component

### Mixed SVG techniques
- Widget_Drag: Uses only `SVG_D3` component
- Widget_Reveal: Uses `SVG_D3` + raw SVG elements

### Different color mapping
- `tiny_outer_dots` uses raw `color` prop (line 146)
- Template uses only computed colors (`fill_color`, `svg_outline_color`)

</details>

---

## Summary

| Aspect | Widget_Drag (Template) | Widget_Reveal |
|:---:|:---:|:---:|
| **Interaction** | More complex (rotation checks, shift-key) | Simpler (toggle expansion only) |
| **Reactive stores** | 6 | 7 (adds grabbed, expanded, title) |
| **SVG elements** | 1 (single dot) | 3 (reveal + fat center + tiny outer) |
| **Color updates** | Dynamic cursor logic | Fixed cursor ('pointer') |
| **SVG path updates** | None | Separate `update_svgPaths()` phase |
| **Rendering technique** | `SVG_D3` only | `SVG_D3` + raw `<svg>` |
