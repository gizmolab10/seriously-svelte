# Hover System Refactoring Proposal

**Goal**: Incrementally reduce complexity, eliminate inconsistencies, and improve maintainability of the hover system while maintaining existing functionality.

**Principles**:
- Each step is independently testable and mergeable
- No step breaks existing functionality
- Tests pass before merging to main
- Progressive improvement, not rewrite

---

## Step 1: Remove Unused `ignore_hover` Flag

**Issue**: `ignore_hover` flag is defined in S_Element:27 but never checked anywhere in the codebase.

**Changes**:
1. Remove `ignore_hover = false` from `S_Element.ts:27`
2. Verify no references exist

**Test Plan**:
```typescript
// tests/hover/Step1_RemoveIgnoreHover.test.ts
import { S_Element } from '../../state/S_Element';
import { Ancestry } from '../../runtime/Ancestry';
import { T_Element } from '../../common/Enumerations';

describe('Step 1: Remove ignore_hover flag', () => {
    test('S_Element should not have ignore_hover property', () => {
        const mockIdentifiable = { /* mock */ };
        const element = new S_Element(mockIdentifiable, T_Element.button, 'test');

        // Should not have ignore_hover property
        expect(element.hasOwnProperty('ignore_hover')).toBe(false);
        expect((element as any).ignore_hover).toBeUndefined();
    });

    test('Hover behavior works without ignore_hover', () => {
        const element = new S_Element(mockIdentifiable, T_Element.button, 'test');

        // Test hover still functions
        element.isHovering = true;
        expect(element.isHovering).toBe(true);

        element.isHovering = false;
        expect(element.isHovering).toBe(false);
    });
});
```

**Verification**:
```bash
# Grep for any usage
grep -r "ignore_hover" src/

# Run tests
npm run test -- Step1_RemoveIgnoreHover.test.ts

# Build and verify no errors
npm run build
```

**Success Criteria**:
- ✅ No grep results for `ignore_hover`
- ✅ All tests pass
- ✅ Build succeeds
- ✅ Manual hover testing works in dev mode

**Risk**: ⭐ Very Low (unused code removal)

---

## Step 2: Standardize Mouse_Responder Usage

**Issue**: Glow_Button.svelte uses `on:mouseenter/on:mouseleave` directly instead of Mouse_Responder pattern.

**Changes**:
1. Refactor `Glow_Button.svelte` to use `Mouse_Responder`
2. Remove direct `on:mouseenter` and `on:mouseleave` handlers
3. Add `handle_s_mouse` callback

**Implementation**:
```svelte
<!-- Before (Glow_Button.svelte:73-76) -->
<div class='glow-button-title'
    on:mouseup={handle_mouse_up}
    on:mousedown={handle_mouse_down}
    on:mouseenter={() => handle_mouse_enter(true)}
    on:mouseleave={() => handle_mouse_enter(false)}
    style='...'>

<!-- After -->
<Mouse_Responder
    width={width}
    height={height}
    name={name}
    handle_s_mouse={handle_s_mouse}
    detect_mouseUp={true}
    detect_mouseDown={true}
    origin={Point.zero}>
    <div class='glow-button-title' style='...'>
```

**Updated Logic**:
```typescript
function handle_s_mouse(s_mouse: S_Mouse) {
    if (s_mouse.hover_didChange) {
        const was_in = isHovering;
        isHovering = s_mouse.isHovering;
        if (s_mouse.isHovering && was_in && detect_autorepeat) {
            mouseTimer.autorepeat_stop();
        }
    } else if (s_mouse.isDown) {
        handle_mouse_down();
    } else if (s_mouse.isUp) {
        handle_mouse_up();
    }
}
```

**Test Plan**:
```typescript
// tests/hover/Step2_StandardizeMouseResponder.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import Glow_Button from '../../svelte/mouse/Glow_Button.svelte';

describe('Step 2: Standardize Mouse_Responder in Glow_Button', () => {
    test('Hover state changes on mouse enter/leave', async () => {
        let clickCount = 0;
        const { container } = render(Glow_Button, {
            props: {
                handle_click: () => { clickCount++; return true; },
                banner_id: 'test',
                title: 'Test',
                name: 'test-button',
                height: 40,
                width: 100
            }
        });

        const button = container.querySelector('.glow-button-title');
        expect(button).toBeTruthy();

        // Test hover in
        await fireEvent.mouseEnter(button);
        // Verify gradient disappears (isHovering = true)
        const gradient = container.querySelector('svg');
        expect(gradient).toBeFalsy(); // Should not render when hovering

        // Test hover out
        await fireEvent.mouseLeave(button);
        // Gradient should reappear
        await new Promise(r => setTimeout(r, 20)); // Wait for 10ms delay
        // Check gradient is back
    });

    test('Click handling works with Mouse_Responder', async () => {
        let clickCount = 0;
        const { container } = render(Glow_Button, {
            props: {
                handle_click: () => { clickCount++; return true; },
                banner_id: 'test',
                title: 'Test',
                name: 'test-button',
                height: 40,
                width: 100
            }
        });

        const responder = container.querySelector('[id="test-button"]');
        await fireEvent.pointerDown(responder);
        await fireEvent.pointerUp(responder);

        expect(clickCount).toBe(1);
    });

    test('Autorepeat works with Mouse_Responder', async () => {
        let clickCount = 0;
        const { container } = render(Glow_Button, {
            props: {
                handle_click: () => { clickCount++; return true; },
                detect_autorepeat: true,
                banner_id: 'test',
                title: 'Test',
                name: 'test-button',
                height: 40,
                width: 100
            }
        });

        const responder = container.querySelector('[id="test-button"]');
        await fireEvent.pointerDown(responder);

        // Wait for autorepeat to trigger
        await new Promise(r => setTimeout(r, 600));
        expect(clickCount).toBeGreaterThan(1);

        await fireEvent.pointerUp(responder);
    });
});
```

**Verification**:
```bash
# Check no other direct mouseenter/leave usage in mouse/
grep -r "on:mouseenter\|on:mouseleave" src/lib/svelte/mouse/

# Run tests
npm run test -- Step2_StandardizeMouseResponder.test.ts

# Manual test: Verify glow buttons in UI work
npm run dev
# Test: Hover over banner buttons, click, autorepeat
```

**Success Criteria**:
- ✅ Glow_Button uses Mouse_Responder
- ✅ All tests pass
- ✅ Hover visual feedback works (gradient disappears on hover)
- ✅ Click handling works
- ✅ Autorepeat works (if enabled)
- ✅ No other components use direct mouseenter/leave in mouse/

**Risk**: ⭐⭐ Low-Medium (behavior change, but well-tested component)

---

## Step 3: Clarify Hover Inversion Naming

**Issue**: Three confusing concepts: `isInverted`, `color_isInverted`, `isHoverInverted`

**Changes**:
1. Rename `isInverted` → `colors_swapOnGrab`
2. Rename `color_isInverted` → `should_useSwappedColors`
3. Rename `isHoverInverted` → `hover_reversalIsActive`
4. Rename `hover_isReversed` → `hover_reverseWhenGrabbed`
5. Add inline comments explaining each

**Implementation**:
```typescript
// S_Element.ts
export default class S_Element {
    // ... existing properties ...

    /**
     * When true, swaps foreground/background colors when ancestry is grabbed.
     * Used by widget dots to show inverted state during drag operations.
     */
    colors_swapOnGrab = false;  // was: isInverted

    /**
     * Computed: Determines if colors should be swapped based on grab state and hover.
     * Returns: colors_swapOnGrab XOR isHovering
     */
    get should_useSwappedColors(): boolean {  // was: color_isInverted
        return this.colors_swapOnGrab != this.isHovering;
    }

    /**
     * Computed: For dots, determines if hover reversal logic is currently active.
     * Complex widget-specific logic for reveal/drag dots.
     */
    get hover_reversalIsActive(): boolean {  // was: isHoverInverted
        if (this.isADot) {
            const a = this.ancestry;
            switch (this.type) {
                case T_Element.reveal:
                    return controls.inTreeMode && a.isExpanded == a.isEditing;
                default:
                    return a.isEditing;
            }
        } else {
            return this.colors_swapOnGrab;
        }
    }

    // Update references in computed properties
    get stroke(): string {
        return this.isDisabled
            ? this.disabledTextColor
            : this.should_useSwappedColors  // was: color_isInverted
                ? this.color_background
                : this.hoverColor;
    }

    get fill(): string {
        return this.isDisabled
            ? 'transparent'
            : this.should_useSwappedColors  // was: color_isInverted
                ? this.hoverColor
                : this.isSelected
                    ? 'lightblue'
                    : this.color_background;
    }

    // In constructor for dots:
    x.si_grabs.w_items.subscribe((grabbed: Ancestry[]) => {
        this.colors_swapOnGrab = !!grabbed && grabbed.includes(this.ancestry);  // was: isInverted
    });
}
```

```svelte
<!-- Widget_Reveal.svelte -->
<script lang='ts'>
    /**
     * When true, reverses hover logic when ancestry is grabbed.
     * Used to maintain correct visual feedback during drag operations.
     */
    export let hover_reverseWhenGrabbed = false;  // was: hover_isReversed

    function set_isHovering(isHovering) {
        const new_isHovering = (hover_reverseWhenGrabbed != ancestry.isGrabbed)
            ? !isHovering
            : isHovering;
        if (!!s_reveal && s_reveal.isHovering != new_isHovering) {
            s_reveal.isHovering = new_isHovering;
            update_colors();
        }
    }
</script>
```

```typescript
// Widget_Drag.svelte
s_drag.colors_swapOnGrab = !!invert && !!ancestry && ancestry.alteration_isAllowed;  // was: isInverted
```

**Test Plan**:
```typescript
// tests/hover/Step3_ClarifyNaming.test.ts
import { S_Element } from '../../state/S_Element';
import { T_Element } from '../../common/Enumerations';

describe('Step 3: Clarify hover inversion naming', () => {
    test('colors_swapOnGrab property exists and works', () => {
        const element = new S_Element(mockIdentifiable, T_Element.drag, 'test');

        expect(element.colors_swapOnGrab).toBeDefined();
        expect(typeof element.colors_swapOnGrab).toBe('boolean');

        element.colors_swapOnGrab = true;
        expect(element.colors_swapOnGrab).toBe(true);
    });

    test('should_useSwappedColors computes XOR correctly', () => {
        const element = new S_Element(mockIdentifiable, T_Element.drag, 'test');

        // Not grabbed, not hovering: false XOR false = false
        element.colors_swapOnGrab = false;
        element.isHovering = false;
        expect(element.should_useSwappedColors).toBe(false);

        // Not grabbed, hovering: false XOR true = true
        element.colors_swapOnGrab = false;
        element.isHovering = true;
        expect(element.should_useSwappedColors).toBe(true);

        // Grabbed, not hovering: true XOR false = true
        element.colors_swapOnGrab = true;
        element.isHovering = false;
        expect(element.should_useSwappedColors).toBe(true);

        // Grabbed, hovering: true XOR true = false
        element.colors_swapOnGrab = true;
        element.isHovering = true;
        expect(element.should_useSwappedColors).toBe(false);
    });

    test('hover_reversalIsActive works for reveal dots', () => {
        const element = new S_Element(mockAncestry, T_Element.reveal, 'test');

        // Test logic based on expanded/editing state
        // (specific test cases based on actual logic)
        expect(element.hover_reversalIsActive).toBeDefined();
    });

    test('Old property names are gone', () => {
        const element = new S_Element(mockIdentifiable, T_Element.drag, 'test');

        expect((element as any).isInverted).toBeUndefined();
        expect((element as any).color_isInverted).toBeUndefined();
        expect((element as any).isHoverInverted).toBeUndefined();
    });
});
```

**Verification**:
```bash
# Ensure no old names remain
grep -r "isInverted" src/ | grep -v "colors_swapOnGrab"
grep -r "color_isInverted" src/ | grep -v "should_useSwappedColors"
grep -r "isHoverInverted" src/ | grep -v "hover_reversalIsActive"
grep -r "hover_isReversed" src/ | grep -v "hover_reverseWhenGrabbed"

# Run tests
npm run test -- Step3_ClarifyNaming.test.ts

# Full test suite
npm run test

# Build
npm run build

# Manual test: Widget hover behavior
npm run dev
```

**Success Criteria**:
- ✅ All old names replaced with clear, descriptive names
- ✅ Comments explain purpose of each property
- ✅ All tests pass
- ✅ Visual behavior unchanged
- ✅ Code is more readable

**Risk**: ⭐⭐ Low-Medium (rename only, behavior unchanged)

---

## Step 4: Eliminate S_Mouse.isHovering Duplication

**Issue**: `s_mouse.isHovering` duplicates `S_Element.isHovering` state.

**Analysis**:
- `S_Mouse.isHovering` is set in Mouse_Responder:114 and passed via `S_Mouse.hover()`
- `S_Element.isHovering` is updated in component's `handle_s_mouse()` callback
- Both track the same information, creating state duplication

**Changes**:
1. Remove `isHovering` from `S_Mouse` class
2. Update `S_Mouse.hover()` factory to not include isHovering
3. Components determine hover state from `handle_isHit()` result
4. Update `s_mouse.description` to not reference isHovering

**Implementation**:
```typescript
// S_Mouse.ts - BEFORE
export default class S_Mouse {
    isHovering: boolean;  // REMOVE THIS
    hover_didChange: boolean;
    // ...

    static hover(event: MouseEvent | null, element: HTMLElement, isHit: boolean) {
        return new S_Mouse(event, element, true, isHit, false, false, false, false, false);
        //                                        ^^^^^ this becomes the hover state
    }
}

// S_Mouse.ts - AFTER
export default class S_Mouse {
    hover_didChange: boolean;
    hover_isHit: boolean;  // NEW: rename isHit parameter to be clearer
    // ...

    get description(): string {
        let states: string[] = [];
        if (this.isUp) { states.push('up'); }
        if (this.isHit) { states.push('hit'); }
        if (this.isDown) { states.push('down'); }
        if (this.isLong) { states.push('long'); }
        if (this.isMove) { states.push('move'); }
        if (this.isDouble) { states.push('double'); }
        if (this.isRepeat) { states.push('repeat'); }
        if (this.hover_didChange) { states.push('hover_didChange'); }
        if (this.hover_isHit) { states.push('hover_hit'); }  // NEW
        // Remove: if (this.isHovering) { states.push('hovering'); }
        return states.length == 0 ? 'empty mouse state' : states.join(', ');
    }

    static hover(event: MouseEvent | null, element: HTMLElement, isHit: boolean) {
        const m = new S_Mouse(event, element, true, false, false, false, false, false, false);
        m.hover_isHit = isHit;
        return m;
    }
}

// Mouse_Responder.svelte - Update hover detection
function handle_movement(event: MouseEvent) {
    setTimeout(() => {
        const mouse_location = $w_mouse_location;
        if (!!bound_element && !!mouse_location) {
            let isHit = false;
            if (!!handle_isHit) {
                isHit = handle_isHit();
            } else {
                isHit = Rect.rect_forElement_containsPoint(bound_element, mouse_location);
            }
            if (s_mouse.isHovering != isHit) {  // Still using s_mouse for tracking
                s_mouse.isHovering = isHit;     // Local tracking only
                s_mouse.hover_didChange = true;
                handle_s_mouse(S_Mouse.hover(null, bound_element, isHit));
                if (isHit) {
                    reset();
                }
            }
        }
    }, 10);
}
```

**Component Updates**:
```typescript
// Widget.svelte, Widget_Reveal.svelte, etc.
function handle_s_mouse(s_mouse: S_Mouse) {
    if (s_mouse.hover_didChange) {
        s_element.isHovering = s_mouse.hover_isHit;  // Use hover_isHit instead of isHovering
        update_colors();
    }
    // ... other logic
}
```

**Test Plan**:
```typescript
// tests/hover/Step4_EliminateDuplication.test.ts
import { S_Mouse } from '../../state/S_Mouse';

describe('Step 4: Eliminate S_Mouse.isHovering duplication', () => {
    test('S_Mouse should not have isHovering property', () => {
        const mouse = S_Mouse.hover(null, document.createElement('div'), true);

        expect((mouse as any).isHovering).toBeUndefined();
        expect(mouse.hover_isHit).toBeDefined();
    });

    test('S_Mouse.hover creates correct state', () => {
        const element = document.createElement('div');

        // Test hit state
        const hitMouse = S_Mouse.hover(null, element, true);
        expect(hitMouse.hover_didChange).toBe(true);
        expect(hitMouse.hover_isHit).toBe(true);

        // Test miss state
        const missMouse = S_Mouse.hover(null, element, false);
        expect(missMouse.hover_didChange).toBe(true);
        expect(missMouse.hover_isHit).toBe(false);
    });

    test('S_Element.isHovering is source of truth', () => {
        const element = new S_Element(mockIdentifiable, T_Element.button, 'test');

        // Simulate hover event
        element.isHovering = true;
        expect(get(s.w_s_hover)).toBe(element);

        element.isHovering = false;
        expect(get(s.w_s_hover)).not.toBe(element);
    });
});
```

**Verification**:
```bash
# Check no references to s_mouse.isHovering (except in Mouse_Responder for local tracking)
grep -r "s_mouse\.isHovering" src/ | grep -v "Mouse_Responder"

# Run tests
npm run test -- Step4_EliminateDuplication.test.ts
npm run test

# Build
npm run build
```

**Success Criteria**:
- ✅ S_Mouse no longer has `isHovering` property
- ✅ Components use `hover_isHit` from S_Mouse events
- ✅ S_Element.isHovering remains single source of truth
- ✅ All tests pass
- ✅ Hover behavior unchanged

**Risk**: ⭐⭐⭐ Medium (touches multiple components, but logic unchanged)

---

## Step 5: Document and Simplify Fallback Behavior

**Issue**: Setting hover to `s_widget` when element unhovered (S_Element:68) has unclear intent.

**Analysis**:
```typescript
// S_Element.ts:65-72
set isHovering(isHovering: boolean) {
    const old_hover = get(s.w_s_hover);
    const same = old_hover == this;
    let new_hover = isHovering ? this : this.s_widget;  // <-- WHY s_widget?
    if (same != isHovering && new_hover != old_hover) {
        s.w_s_hover.set(new_hover);
    }
}
```

**Intent Investigation**:
- When unhover a dot, fall back to parent widget
- Allows widget border to remain when hovering dots
- Provides "sticky" hover for widget container

**Changes**:
1. Add comprehensive comments explaining the logic
2. Add optional `fallback_hover` parameter to make it explicit
3. Create helper method for clarity
4. Add debug logging (disabled by default)

**Implementation**:
```typescript
// S_Element.ts
export default class S_Element {
    html_element: HTMLElement | null = null;

    /**
     * Optional fallback element to hover when this element is unhovered.
     * Used by widget dots to maintain hover on parent widget when mouse
     * moves between dots, preventing flicker of widget borders.
     */
    s_widget: S_Widget | null = null;

    // ... other properties ...

    /**
     * Sets hover state for this element and updates global w_s_hover store.
     *
     * Hover Fallback Logic:
     * - When hovering (true): Sets global hover to THIS element
     * - When unhovering (false): Falls back to s_widget (if exists)
     *
     * Why fallback? For widget dots (drag/reveal), when mouse moves off
     * a dot but is still over the widget, we want the widget to remain
     * hovered. This prevents border flicker during rapid dot-to-dot movement.
     *
     * Example flow:
     * 1. Hover widget → widget shows border
     * 2. Hover drag dot → dot inverts colors, widget stays hovered (border remains)
     * 3. Unhover drag dot → falls back to widget (border remains)
     * 4. Move to reveal dot → reveal dot inverts, widget stays hovered
     * 5. Unhover widget entirely → widget border disappears
     */
    set isHovering(isHovering: boolean) {
        const old_hover = get(s.w_s_hover);
        const is_currently_hovered = old_hover == this;

        // Determine new hover target
        let new_hover: S_Element | null = null;
        if (isHovering) {
            new_hover = this;
        } else if (this.s_widget) {
            // Fallback to parent widget when unhover a dot
            new_hover = this.s_widget;
            debug.log_hover(`Unhover ${this.name}, fallback to ${this.s_widget.name}`);
        } else {
            new_hover = null;
        }

        // Only update if state actually changed
        const should_update = is_currently_hovered != isHovering
                           && new_hover != old_hover;

        if (should_update) {
            s.w_s_hover.set(new_hover);
            debug.log_hover(`Hover change: ${old_hover?.name ?? 'none'} → ${new_hover?.name ?? 'none'}`);
        }
    }

    get isHovering(): boolean {
        return get(s.w_s_hover) == this;
    }
}
```

**Test Plan**:
```typescript
// tests/hover/Step5_DocumentFallback.test.ts
import { S_Element, S_Widget } from '../../state';
import { s } from '../../state/State';
import { get } from 'svelte/store';

describe('Step 5: Document and simplify fallback behavior', () => {
    let widget: S_Widget;
    let drag_dot: S_Element;
    let reveal_dot: S_Element;

    beforeEach(() => {
        widget = new S_Widget(mockAncestry);
        drag_dot = widget.s_drag;
        reveal_dot = widget.s_reveal;
    });

    test('Hovering dot sets global hover to dot', () => {
        drag_dot.isHovering = true;
        expect(get(s.w_s_hover)).toBe(drag_dot);
    });

    test('Unhovering dot falls back to widget', () => {
        // Hover sequence: none → widget → dot → widget (fallback)
        widget.isHovering = true;
        expect(get(s.w_s_hover)).toBe(widget);

        drag_dot.isHovering = true;
        expect(get(s.w_s_hover)).toBe(drag_dot);

        drag_dot.isHovering = false;
        expect(get(s.w_s_hover)).toBe(widget);  // Fallback!
    });

    test('Unhovering widget clears hover entirely', () => {
        widget.isHovering = true;
        expect(get(s.w_s_hover)).toBe(widget);

        widget.isHovering = false;
        expect(get(s.w_s_hover)).toBeNull();  // No fallback for widget
    });

    test('Dot-to-dot hover maintains widget hover', () => {
        widget.isHovering = true;

        // Hover drag dot
        drag_dot.isHovering = true;
        expect(get(s.w_s_hover)).toBe(drag_dot);

        // Move to reveal dot (drag unhover → widget, then reveal hover)
        drag_dot.isHovering = false;
        expect(get(s.w_s_hover)).toBe(widget);  // Fallback

        reveal_dot.isHovering = true;
        expect(get(s.w_s_hover)).toBe(reveal_dot);

        // Throughout, widget would maintain hover state for border
    });

    test('Element without s_widget has no fallback', () => {
        const standalone = new S_Element(mockIdentifiable, T_Element.button, 'test');
        standalone.s_widget = null;

        standalone.isHovering = true;
        expect(get(s.w_s_hover)).toBe(standalone);

        standalone.isHovering = false;
        expect(get(s.w_s_hover)).toBeNull();  // No fallback
    });
});
```

**Verification**:
```bash
# Run tests
npm run test -- Step5_DocumentFallback.test.ts

# Manual test: Widget hover behavior
npm run dev
# Test: Hover widget, then drag dot, then reveal dot
# Expected: Widget border stays visible throughout
```

**Success Criteria**:
- ✅ Fallback logic fully documented with examples
- ✅ Code more readable and intentional
- ✅ All tests pass
- ✅ Widget hover behavior unchanged (borders persist correctly)

**Risk**: ⭐ Very Low (documentation + refactoring, no logic change)

---

## Step 6: Reduce Delayed Hover Detection

**Issue**: 10ms setTimeout in Mouse_Responder:104 to wait for store updates is a code smell.

**Analysis**:
The delay exists because `w_mouse_location` might not be updated when the event arrives. This is a race condition workaround.

**Better Approach**:
Use the event's own coordinates instead of waiting for global store update.

**Changes**:
1. Pass event coordinates directly to hit detection
2. Remove setTimeout wrapper
3. Fallback to global `w_mouse_location` only if event is null

**Implementation**:
```typescript
// Mouse_Responder.svelte - BEFORE
function handle_movement(event: MouseEvent) {
    setTimeout(() => {  // <-- Remove this setTimeout
        const mouse_location = $w_mouse_location;
        if (!!bound_element && !!mouse_location) {
            let isHit = false;
            if (!!handle_isHit) {
                isHit = handle_isHit();
            } else {
                isHit = Rect.rect_forElement_containsPoint(bound_element, mouse_location);
            }
            // ... rest
        }
    }, 10);
}

// Mouse_Responder.svelte - AFTER
function handle_movement(event: MouseEvent | null) {
    // Get mouse position from event directly (no delay needed)
    let mouse_location: Point | null = null;
    if (event) {
        mouse_location = new Point(event.clientX, event.clientY);
    } else {
        // Fallback to global store for synthetic events
        mouse_location = $w_mouse_location;
    }

    if (!!bound_element && !!mouse_location) {
        let isHit = false;
        if (!!handle_isHit) {
            // Custom hit detection (e.g., for non-rectangular shapes)
            isHit = handle_isHit(mouse_location);  // Pass location to custom function
        } else {
            // Standard bounding box detection
            isHit = Rect.rect_forElement_containsPoint(bound_element, mouse_location);
        }

        if (s_mouse.isHovering != isHit) {
            s_mouse.isHovering = isHit;
            s_mouse.hover_didChange = true;
            handle_s_mouse(S_Mouse.hover(event, bound_element, isHit));
            if (isHit) {
                reset();
            }
        }
    }
}
```

**Update Custom Hit Detection**:
```typescript
// Components using handle_isHit now receive mouse_location
export let handle_isHit: ((location: Point) => boolean) | null = null;
```

**Test Plan**:
```typescript
// tests/hover/Step6_RemoveDelay.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import Mouse_Responder from '../../svelte/mouse/Mouse_Responder.svelte';

describe('Step 6: Remove delayed hover detection', () => {
    test('Hover detection uses event coordinates immediately', async () => {
        let hoverStates: boolean[] = [];

        const { container } = render(Mouse_Responder, {
            props: {
                width: 100,
                height: 50,
                name: 'test',
                origin: Point.zero,
                handle_s_mouse: (s_mouse) => {
                    if (s_mouse.hover_didChange) {
                        hoverStates.push(s_mouse.hover_isHit);
                    }
                }
            }
        });

        const element = container.querySelector('[id="test"]');

        // Fire mouse events
        await fireEvent.mouseMove(element, { clientX: 50, clientY: 25 });
        await fireEvent.mouseLeave(element);

        // Should detect immediately without setTimeout delay
        expect(hoverStates.length).toBe(2);
        expect(hoverStates[0]).toBe(true);   // Enter
        expect(hoverStates[1]).toBe(false);  // Leave
    });

    test('Custom handle_isHit receives mouse location', async () => {
        let receivedLocation: Point | null = null;

        const customHitDetection = (location: Point) => {
            receivedLocation = location;
            return location.x > 50;  // Only hit right half
        };

        const { container } = render(Mouse_Responder, {
            props: {
                width: 100,
                height: 50,
                name: 'test',
                origin: Point.zero,
                handle_isHit: customHitDetection,
                handle_s_mouse: () => {}
            }
        });

        const element = container.querySelector('[id="test"]');
        await fireEvent.mouseMove(element, { clientX: 75, clientY: 25 });

        expect(receivedLocation).not.toBeNull();
        expect(receivedLocation.x).toBe(75);
        expect(receivedLocation.y).toBe(25);
    });

    test('Hover state changes are synchronous', () => {
        const start = performance.now();
        let hoverChanged = false;

        const { container } = render(Mouse_Responder, {
            props: {
                width: 100,
                height: 50,
                name: 'test',
                origin: Point.zero,
                handle_s_mouse: (s_mouse) => {
                    if (s_mouse.hover_didChange) {
                        hoverChanged = true;
                    }
                }
            }
        });

        const element = container.querySelector('[id="test"]');
        fireEvent.mouseMove(element, { clientX: 50, clientY: 25 });

        const elapsed = performance.now() - start;

        expect(hoverChanged).toBe(true);
        expect(elapsed).toBeLessThan(5);  // Should be immediate, not 10ms+ delayed
    });
});
```

**Verification**:
```bash
# Check no setTimeout in hover logic
grep -A 3 "handle_movement" src/lib/svelte/mouse/Mouse_Responder.svelte | grep setTimeout
# Should return nothing

# Run tests
npm run test -- Step6_RemoveDelay.test.ts

# Performance test
npm run dev
# Monitor hover responsiveness - should feel snappier
```

**Success Criteria**:
- ✅ No setTimeout in hover detection
- ✅ Hover uses event coordinates directly
- ✅ Custom handle_isHit receives location parameter
- ✅ All tests pass
- ✅ Hover feels more responsive
- ✅ No race conditions observed

**Risk**: ⭐⭐⭐ Medium (timing change could expose edge cases)

---

## Step 7: Consolidate Inversion Logic

**Issue**: Three separate concepts (after renaming in Step 3): `colors_swapOnGrab`, `should_useSwappedColors`, `hover_reversalIsActive`

**Goal**: Create a unified, understandable model for when colors invert.

**Analysis**:
- `colors_swapOnGrab`: Set externally (when grabbed)
- `should_useSwappedColors`: XOR of colors_swapOnGrab and isHovering
- `hover_reversalIsActive`: Widget-specific override

**Better Model**:
```
Color Selection = f(base_state, hover_state, widget_type)
where:
  base_state = grabbed/editing/normal
  hover_state = hovering/not
  widget_type = widget/drag/reveal/button/etc.
```

**Changes**:
1. Create `ColorState` enum for clarity
2. Create `computeColorState()` method
3. Simplify stroke/fill getters

**Implementation**:
```typescript
// types/Types.ts
export enum T_ColorState {
    normal,           // Default colors
    inverted,         // Swapped colors (hover on normal, or not-hover on grabbed)
    highlighted,      // Special state (selected, etc.)
    disabled          // Grayed out
}

// S_Element.ts
export default class S_Element {
    colors_swapOnGrab = false;

    /**
     * Computes the current color state based on element state.
     * Centralized logic for color inversion to improve maintainability.
     */
    get colorState(): T_ColorState {
        if (this.isDisabled) {
            return T_ColorState.disabled;
        }

        if (this.isSelected) {
            return T_ColorState.highlighted;
        }

        // Core inversion logic: grabbed XOR hovering
        const should_invert = this.colors_swapOnGrab != this.isHovering;
        return should_invert ? T_ColorState.inverted : T_ColorState.normal;
    }

    /**
     * Stroke color based on color state.
     * Inverted: background color
     * Normal: hover color
     */
    get stroke(): string {
        switch (this.colorState) {
            case T_ColorState.disabled:
                return this.disabledTextColor;
            case T_ColorState.inverted:
                return this.color_background;
            case T_ColorState.normal:
            case T_ColorState.highlighted:
            default:
                return this.hoverColor;
        }
    }

    /**
     * Fill color based on color state.
     * Inverted: hover color
     * Normal: background color
     * Highlighted: special color (lightblue)
     */
    get fill(): string {
        switch (this.colorState) {
            case T_ColorState.disabled:
                return 'transparent';
            case T_ColorState.inverted:
                return this.hoverColor;
            case T_ColorState.highlighted:
                return 'lightblue';
            case T_ColorState.normal:
            default:
                return this.color_background;
        }
    }

    // Remove: should_useSwappedColors getter (now handled by colorState)
}
```

**Test Plan**:
```typescript
// tests/hover/Step7_ConsolidateInversion.test.ts
import { S_Element, T_ColorState } from '../../state/S_Element';

describe('Step 7: Consolidate inversion logic', () => {
    let element: S_Element;

    beforeEach(() => {
        element = new S_Element(mockIdentifiable, T_Element.drag, 'test');
        element.hoverColor = 'red';
        element.color_background = 'white';
    });

    test('Color state transitions: normal → inverted on hover', () => {
        element.colors_swapOnGrab = false;
        element.isHovering = false;
        expect(element.colorState).toBe(T_ColorState.normal);

        element.isHovering = true;
        expect(element.colorState).toBe(T_ColorState.inverted);
    });

    test('Color state transitions: grabbed dot inverts on unhover', () => {
        element.colors_swapOnGrab = true;  // Grabbed
        element.isHovering = true;
        expect(element.colorState).toBe(T_ColorState.normal);  // Grabbed XOR hovering = false

        element.isHovering = false;
        expect(element.colorState).toBe(T_ColorState.inverted);  // Grabbed XOR not-hovering = true
    });

    test('Stroke/fill colors match color state', () => {
        element.colors_swapOnGrab = false;

        // Normal state
        element.isHovering = false;
        expect(element.colorState).toBe(T_ColorState.normal);
        expect(element.stroke).toBe('red');    // hoverColor
        expect(element.fill).toBe('white');    // color_background

        // Inverted state (hovering)
        element.isHovering = true;
        expect(element.colorState).toBe(T_ColorState.inverted);
        expect(element.stroke).toBe('white');  // color_background (inverted)
        expect(element.fill).toBe('red');      // hoverColor (inverted)
    });

    test('Disabled state overrides everything', () => {
        element.isDisabled = true;
        element.isHovering = true;
        element.colors_swapOnGrab = true;

        expect(element.colorState).toBe(T_ColorState.disabled);
        expect(element.stroke).toBe(element.disabledTextColor);
        expect(element.fill).toBe('transparent');
    });

    test('Highlighted state for selected elements', () => {
        element.isSelected = true;

        expect(element.colorState).toBe(T_ColorState.highlighted);
        expect(element.fill).toBe('lightblue');
    });
});
```

**Verification**:
```bash
# Run tests
npm run test -- Step7_ConsolidateInversion.test.ts
npm run test

# Build
npm run build

# Visual regression test
npm run dev
# Test all widget states: normal, hover, grabbed, editing
# Verify colors match expected behavior
```

**Success Criteria**:
- ✅ Single `colorState` source of truth
- ✅ Inversion logic centralized and clear
- ✅ All tests pass
- ✅ Visual behavior unchanged
- ✅ Code significantly more maintainable

**Risk**: ⭐⭐⭐ Medium (refactors core visual logic)

---

## Implementation Order & Timeline

**Phase 1: Low-Risk Cleanup** (1-2 days)
1. Step 1: Remove unused flag ✓
2. Step 5: Document fallback behavior ✓

**Phase 2: Standardization** (2-3 days)
3. Step 2: Standardize Mouse_Responder ✓
4. Step 3: Clarify naming ✓

**Phase 3: Architecture Improvements** (3-5 days)
5. Step 4: Eliminate duplication ✓
6. Step 6: Remove delayed detection ✓
7. Step 7: Consolidate inversion logic ✓

**Total Estimated Time**: 6-10 days (including testing and PR reviews)

---

## Rollback Plan

Each step is independently reversible:
- Git revert individual commits
- Each step has clear before/after state
- Tests verify rollback success

---

## Success Metrics

**Quantitative**:
- ✅ Test coverage for hover system: >80%
- ✅ Reduction in code complexity (cyclomatic complexity)
- ✅ Hover-related code lines reduced by ~15%
- ✅ Zero regressions in existing functionality

**Qualitative**:
- ✅ Code is self-documenting (clear names, comments)
- ✅ New developers can understand hover logic in <30 minutes
- ✅ Hover behavior is predictable and consistent
- ✅ Future changes are easier to implement

---

## Post-Refactoring Documentation

Update CLAUDE.md to reflect:
- Simplified architecture (remove complexity points)
- Resolved inconsistencies
- Updated best practices
- New color state model
