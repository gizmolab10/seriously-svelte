# Mouse Timer Centralization in Hits

## Current State

### Autorepeat (Centralized ✅)

Autorepeat timing is already centralized in `Hits`:

- `Hits` owns a single `Mouse_Timer` (`autorepeat_timer`) plus `w_autorepeating_target` store
- Components set properties on their `S_Hit_Target`:
  - `detect_autorepeat?: boolean`
  - `autorepeat_callback?: () => void`
  - `autorepeat_id?: number`
- In `Hits.handle_click_at`:
  - On `s_mouse.isDown` with `detect_autorepeat`/`autorepeat_callback` set → calls `start_autorepeat(target)`
  - On `s_mouse.isUp` → calls `stop_autorepeat()`
- In `Hits.detect_hovering_at`:
  - If hover leaves the autorepeating target → calls `stop_autorepeat()`

### Long-Click (Per-Component)

Long-click detection is still per-component:

- `Button.svelte` uses its own `mouse_timer` via `e.mouse_timer_forName(name)`
- On mouse down, if `detect_longClick` is true, calls `mouse_timer.timeout_start(T_Timer.long, callback)`
- On timer fire → calls `handle_s_mouse(S_Mouse.long(...))`
- On mouse up or hover leave → calls `mouse_timer.reset()`

// Button.svelte (current)
if (detect_longClick) {
    mouse_timer.timeout_start(T_Timer.long, () => {
        if (mouse_timer.hasTimer_forID(T_Timer.long)) {
            reset();
            s_mouse.clicks = 0;
            handle_s_mouse(S_Mouse.long(s_mouse.event!, element));
            recompute_style();
        }
    });
}### Double-Click (Not Implemented)

Double-click detection is not centralized. Components would need to:
- Track click count per-component
- Use a timer to distinguish single from double-click
- Defer single-click callback until timer expires

### Click Counting (Per-Component)

Click counting currently lives in per-component `S_Mouse` instances:

// Button.svelte
const s_mouse = elements.s_mouse_forName(name);

// In intercept_handle_s_mouse:
if (s_mouse.clicks == 0) {
    handle_s_mouse(s_mouse);
}
s_mouse.clicks += 1;

// In reset:
s_mouse.clicks = 0;Purpose:
- Suppress duplicate down events (only fire if `clicks == 0`)
- Track click count for potential double-click detection

---

## Proposal

### 1. Add Properties to `S_Hit_Target`

Follow the autorepeat pattern:

// S_Hit_Target.ts
detect_longClick?: boolean;
longClick_callback?: (s_mouse: S_Mouse) => void;

detect_doubleClick?: boolean;
doubleClick_callback?: (s_mouse: S_Mouse) => void;

clicks: number = 0;  // Move click counting here### 2. Add State/Stores to `Hits`

// Hits.ts
w_longClick_target = writable<S_Hit_Target | null>(null);
click_timer: Mouse_Timer = new Mouse_Timer('hits-click');
pending_singleClick_target: S_Hit_Target | null = null;
pending_singleClick_event: MouseEvent | null = null;### 3. Extend `handle_click_at` Logic

**On mouse down:**
- Increment `target.clicks`
- If `target.detect_longClick` → start long-click timer, store pending target/event
- If `target.detect_doubleClick`:
  - If second click within threshold → fire `doubleClick_callback`, cancel timer
  - If first click → start double-click timer, defer single-click

**On mouse up (before timers fire):**
- Cancel long-click timer
- Reset `target.clicks`
- If single-click was deferred by double-click detection → fire now (or let timer handle it)

**When long-click timer fires:**
- Fire `longClick_callback` with `S_Mouse.long(...)`
- Set flag to suppress subsequent mouse-up from triggering regular click

**When double-click timer expires:**
- User didn't click again → fire deferred single-click callback
- Reset `target.clicks`

### 4. Cleanup on Hover-Leave

In `detect_hovering_at`, cancel pending timers if mouse leaves the target:

const longClick_target = get(this.w_longClick_target);
if (!!longClick_target && (!match || !match.isEqualTo(longClick_target))) {
    this.cancel_longClick();
}
// Similar for pending double-click### 5. Proposed `handle_click_at` Flow

handle_click_at(point: Point, s_mouse: S_Mouse): boolean {
    const target = this.select_topmost_target(point, s_mouse);
    if (!target) return false;

    if (s_mouse.isDown && s_mouse.event) {
        target.clicks += 1;

        // Long-click detection
        if (target.detect_longClick) {
            this.start_longClick(target, s_mouse.event);
        }

        // Double-click detection
        if (target.detect_doubleClick) {
            if (target.clicks == 2 && this.click_timer.hasTimer_forID(T_Timer.double)) {
                // Second click within threshold
                this.click_timer.reset();
                target.clicks = 0;
                target.doubleClick_callback?.(S_Mouse.double(s_mouse.event, target.html_element!));
                return true;
            } else if (target.clicks == 1) {
                // First click — defer single-click
                this.pending_singleClick_target = target;
                this.pending_singleClick_event = s_mouse.event;
                this.click_timer.timeout_start(T_Timer.double, () => {
                    // Timer expired, no second click
                    target.handle_s_mouse?.(S_Mouse.down(this.pending_singleClick_event!, target.html_element!));
                    target.clicks = 0;
                    this.pending_singleClick_target = null;
                });
                return true;
            }
        } else {
            // No double-click detection — fire immediately
            target.handle_s_mouse?.(s_mouse);
        }

        // Autorepeat (existing logic)
        if (target.detect_autorepeat && target.autorepeat_callback) {
            this.start_autorepeat(target);
        }

        return true;
    }

    if (s_mouse.isUp) {
        this.cancel_longClick();
        this.stop_autorepeat();
        target.clicks = 0;
        target.handle_s_mouse?.(s_mouse);
        return true;
    }

    return false;
}---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Long-click cancels single-click** | If long-click fires, subsequent mouse-up shouldn't trigger another callback | Set a `longClick_fired` flag, check in mouse-up handler |
| **Double-click delays single-click** | ~200ms delay for single-click when `detect_doubleClick` is enabled | Make this opt-in per target; document the tradeoff |
| **Click counting conflicts** | Components may still expect per-component `S_Mouse.clicks` | Migrate all click counting to `S_Hit_Target.clicks`; deprecate `S_Mouse.clicks` |
| **Timer conflicts** | Multiple targets with overlapping timers could interfere | Each timer tracks which target it belongs to; cancel on target change |
| **Hover-leave edge cases** | User presses, moves off target, releases elsewhere | Cancel pending timers in `detect_hovering_at`; suppress callbacks |
| **Autorepeat + long-click interaction** | Both use timing; could conflict if both enabled on same target | Autorepeat should suppress long-click (autorepeat is a "long-click that keeps firing") |

---

## Deprecation

### What `S_Mouse` Is

`S_Mouse` is a **transient value object** — a tidy clump that encapsulates current mouse-relevant information:

- **What happened**: `isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove`
- **Where**: `element` (the target HTMLElement)
- **Raw data**: `event` (the original MouseEvent, for coords, modifiers, etc.)

The static factories make construction semantic:

```ts
S_Mouse.down(event, element)    // user pressed
S_Mouse.up(event, element)      // user released
S_Mouse.long(event, element)    // held past threshold
S_Mouse.double(event, element)  // second click within threshold
S_Mouse.repeat(event, element)  // autorepeat tick
```

Components receive these and just ask `if (s_mouse.isLong)` — they don't care how the timing was detected.

### What Stays

| `S_Mouse` role | Still needed? |
|----------------|---------------|
| Flags: `isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove` | ✅ Yes |
| Carries `event: MouseEvent` and `element: HTMLElement` | ✅ Yes |
| Static factories: `S_Mouse.down()`, `.up()`, `.long()`, `.double()`, `.repeat()` | ✅ Yes |
| Passed to `handle_s_mouse(s_mouse)` callbacks | ✅ Yes |

### What Gets Deprecated

| Current pattern | Change |
|-----------------|--------|
| `elements.s_mouse_forName(name)` — persistent per-component instance | **Deprecated** — no longer needed |
| `S_Mouse.clicks` property mutated by Button | **Deprecated** — moves to `S_Hit_Target.clicks` |

### Why

The `elements.s_mouse_forName(name)` pattern was a workaround to persist `clicks` across events. Once `Hits` owns click counting via `S_Hit_Target.clicks`, components can receive fresh `S_Mouse` instances each time — cleaner and stateless from the component's perspective.

The factories (`S_Mouse.long()`, `S_Mouse.double()`, etc.) become even more important since `Hits` will construct these when firing callbacks.

---

## Task List

### Infrastructure ✅

- [x] Add `detect_longClick`, `longClick_callback` to `S_Hit_Target`
- [x] Add `detect_doubleClick`, `doubleClick_callback` to `S_Hit_Target`
- [x] Add `clicks: number = 0` to `S_Hit_Target`
- [x] Add `w_longClick_target` store to `Hits`
- [x] Add `click_timer: Mouse_Timer` to `Hits`
- [x] Add `pending_singleClick_target` / `pending_singleClick_event` to `Hits`
- [x] Implement `start_longClick(target, event)` in `Hits`
- [x] Implement `cancel_longClick()` in `Hits`
- [x] Extend `handle_click_at` with long-click and double-click logic
- [x] Extend `detect_hovering_at` to cancel timers on hover-leave
- [x] Add `longClick_fired` flag to suppress mouse-up after long-click

### Migration

- [ ] **Button.svelte**: Remove `mouse_timer` for long-click; set `detect_longClick` and `longClick_callback` on `s_button`
- [ ] **Button.svelte**: Remove `elements.s_mouse_forName(name)` and per-component click counting
- [ ] **Button.svelte**: Remove `if (s_mouse.clicks == 0)` guard (now handled by `Hits`)
- [ ] Add double-click support to components that need it (TBD)

### Testing

- [ ] Verify long-click fires after threshold, suppresses regular click
- [ ] Verify double-click fires on second click within threshold
- [ ] Verify single-click fires after double-click timer expires (when `detect_doubleClick` enabled)
- [ ] Verify hover-leave cancels pending long-click and double-click timers
- [ ] Verify autorepeat still works correctly
- [ ] Verify no regression in existing button behavior

### Cleanup

- [ ] Deprecate or remove `S_Mouse.clicks` if no longer used
- [ ] Update `clicks.md` design doc to reflect centralized model
- [ ] Remove per-component `Mouse_Timer` instances where no longer needed