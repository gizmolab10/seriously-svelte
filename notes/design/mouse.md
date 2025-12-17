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

### 1. Use `T_Mouse_Detection` Enum

The `T_Mouse_Detection` enum (in `Enumerations.ts`) uses bit flags to define mutually exclusive modes:

```ts
export enum T_Mouse_Detection {
    autorepeat = 4,  // Mutually exclusive with others
    doubleLong = 3,  // double | long (can combine these two)
    double     = 1,
    long       = 2,
    none       = 0,
}
```

`S_Hit_Target` uses a single `mouse_detection` property instead of separate boolean flags:

```ts
// S_Hit_Target.ts
mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
longClick_callback?: (s_mouse: S_Mouse) => void;
doubleClick_callback?: (s_mouse: S_Mouse) => void;
clicks: number = 0;

// Getters for backward compatibility with Hits logic
get detect_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
get detect_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
get detect_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
```

Components pass `mouse_detection={T_Mouse_Detection.autorepeat}` instead of `detect_autorepeat={true}`.### 2. Add State/Stores to `Hits`

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


| Risk                                                         | Impact                                                                                                                                                  | Mitigation                                                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Long-click cancels single-click**                          | If long-click fires, subsequent mouse-up shouldn't trigger another callback                                                                             | Set a`longClick_fired` flag, check in mouse-up handler                                                                                                                  |
| **Double-click delays single-click**                         | ~200ms delay for single-click when`detect_doubleClick` is enabled                                                                                       | Make this opt-in per target; document the tradeoff                                                                                                                      |
| **Click counting conflicts**                                 | Components may still expect per-component`S_Mouse.clicks`                                                                                               | Migrate all click counting to`S_Hit_Target.clicks`; deprecate `S_Mouse.clicks`                                                                                          |
| **Timer conflicts**                                          | Multiple targets with overlapping timers could interfere                                                                                                | Each timer tracks which target it belongs to; cancel on target change                                                                                                   |
| **Hover-leave edge cases**                                   | User presses, moves off target, releases elsewhere                                                                                                      | Cancel pending timers in`detect_hovering_at`; suppress callbacks                                                                                                        |
| **Autorepeat incompatible with long-click and double-click** | Autorepeat fires immediately and repeatedly; long-click waits then fires once; double-click defers first click. These are mutually exclusive behaviors. | **Enforced via `T_Mouse_Detection` enum.** `autorepeat = 4` cannot be combined with `double = 1` or `long = 2`. Only `doubleLong = 3` allows combining double and long. |

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


| `S_Mouse` role                                                                  | Still needed? |
| --------------------------------------------------------------------------------- | --------------- |
| Flags:`isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove`              | ✅ Yes        |
| Carries`event: MouseEvent` and `element: HTMLElement`                           | ✅ Yes        |
| Static factories:`S_Mouse.down()`, `.up()`, `.long()`, `.double()`, `.repeat()` | ✅ Yes        |
| Passed to`handle_s_mouse(s_mouse)` callbacks                                    | ✅ Yes        |

### What Gets Deprecated


| Current pattern                                                       | Change                                                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `elements.s_mouse_forName(name)` — persistent per-component instance | **Deprecated** — no longer needed                                         |
| `S_Mouse.clicks` property mutated by Button                           | **Deprecated** — moves to `S_Hit_Target.clicks`                           |
| `detect_autorepeat` / `detect_longClick` boolean props                | **Replaced** by `mouse_detection: T_Mouse_Detection` enum prop             |
| `s_element.detect_autorepeat = true` direct assignment                | **Replaced** by `s_element.mouse_detection = T_Mouse_Detection.autorepeat` |

### Why

The `elements.s_mouse_forName(name)` pattern was a workaround to persist `clicks` across events. Once `Hits` owns click counting via `S_Hit_Target.clicks`, components can receive fresh `S_Mouse` instances each time — cleaner and stateless from the component's perspective.

The factories (`S_Mouse.long()`, `S_Mouse.double()`, etc.) become even more important since `Hits` will construct these when firing callbacks.

---

## Task List

### Infrastructure ✅

- [X] Add `detect_longClick`, `longClick_callback` to `S_Hit_Target`
- [X] Add `detect_doubleClick`, `doubleClick_callback` to `S_Hit_Target`
- [X] Add `clicks: number = 0` to `S_Hit_Target`
- [X] Add `w_longClick_target` store to `Hits`
- [X] Add `click_timer: Mouse_Timer` to `Hits`
- [X] Add `pending_singleClick_target` / `pending_singleClick_event` to `Hits`
- [X] Implement `start_longClick(target, event)` in `Hits`
- [X] Implement `cancel_longClick()` in `Hits`
- [X] Extend `handle_click_at` with long-click and double-click logic
- [X] Extend `detect_hovering_at` to cancel timers on hover-leave
- [X] Add `longClick_fired` flag to suppress mouse-up after long-click

### Migration ✅

- [X] **Button.svelte**: Remove `mouse_timer` for long-click; set `detect_longClick` and `longClick_callback` on `s_button`
- [X] **Button.svelte**: Remove `elements.s_mouse_forName(name)` and per-component click counting
- [X] **Button.svelte**: Remove `if (s_mouse.clicks == 0)` guard (now handled by `Hits`)
- [X] **All components**: Replace `detect_autorepeat`/`detect_longClick` boolean props with `mouse_detection: T_Mouse_Detection`
- [X] **Glow_Button.svelte**, **Next_Previous.svelte**: Use `s_element.mouse_detection = T_Mouse_Detection.autorepeat`
- [X] **Triangle_Button.svelte**, **Buttons_Row.svelte**, **Buttons_Table.svelte**: Updated prop interface
- [X] **Steppers.svelte**, **D_Actions.svelte**: Pass `mouse_detection={T_Mouse_Detection.autorepeat}`

### Testing

#### Setup

All tests assume a **widget is selected** in the graph or (search results) list view. Without a selection, actions do not appear as only one of them makes sense (center the graph, tbd later).

#### Setup

| Term              | Definition                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **details panel** | a stack of buttons, each of which opens a panel. to show this stack, tap the details toggle (three horizontal bars, at top left).             |
| **actions panel** | The details panel showing action buttons in seven categories (browse, focus, show, center, add, delete, move).                                |
| **browse action** | One of the four directional actions (left, up, down, right) in the top row. Changes selection to an adjacent widget.                          |
| **down action**   | Selects the next sibling below the current selection.                                                                                         |
| **re-render**     | When Svelte destroys and recreates a component (e.g., after selection changes). The`S_Hit_Target` persists but the component instance is new. |
| **steppers**      | Up/down triangle buttons used to increment/decrement numeric values (e.g., in settings or property editors).                                  |

#### Regression
1. **Normal-click** buttons work normally
   - [ ] Verify: single click works, no unexpected delays or repeats
	   - [x] breadcrumbs -- delay
	   - [x] details toggle -- delay
	   - [ ] search -- ignored
		   - [x] ignored on first such event
		   - [ ] ignored on subsequent ones
	   - [ ] close search -- ignored
		   - [x] ignored on first such event
		   - [ ] ignored on subsequent ones
	   - [x] widget drag button -- delay
	   - [x] widget reveal button -- delay
	   - [x] all segmented controls (eg, tree/radial) -- delay
#### Autorepeat
2. **Basic autorepeat, proof that works across UI re-render**
   - [x] Open actions panel
   - [x] Press and **hold** a browse action (try down)
   - [x] Verify: 
	   - [x] first action (change the selection) → fires immediately
	   - [x] then → repeats after a short delay
	   - [x] when the mouse is released → repeating stops
2. **Hover-leave cancels autorepeat**
   - [x] Same as 1, above, press and hold a browse action
   - [x] While holding, drag mouse off the button
   - [x] Verify: autorepeat stops immediately
   - [x] **BAD** -- lots of ui text is selected
4. **Steppers autorepeat**
   - [x] Click on the build button, bottom left of graph
   - [x] The build notes will pop up
   - [x] The steppers are at the upper left
   - [x] Press and hold the downward pointing button
   - [x] Verify: value increments/decrements repeatedly
#### Double-Click (when implemented)
5. **Double-click fires on second click**
   - [ ] Find a button with `mouse_detection = T_Mouse_Detection.double`
   - [ ] Click twice quickly (within ~300ms)
   - [ ] Verify: double-click callback fires, single-click does not
6. **Single-click deferred then fires**
   - [ ] Click once, wait for threshold to expire
   - [ ] Verify: single-click callback fires after delay
7. **Hover-leave cancels pending double-click**
    - [ ] Click once, immediately move mouse off button
    - [ ] Verify: pending single-click is cancelled
#### Long-Click
8. **Long-click fires after threshold**
   - [ ] Find a button with `mouse_detection = T_Mouse_Detection.long` (TBD which component uses this)
   - [ ] Press and hold past threshold (~500ms)
   - [ ] Verify: long-click callback fires
9. **Long-click suppresses regular click**

   - [ ] After long-click fires (step 4), release mouse
   - [ ] Verify: no additional click action fires on release
10. **Early release prevents long-click**

   - [ ] Press button, release before threshold
   - [ ] Verify: normal click fires, not long-click
11. **Hover-leave cancels long-click timer**
   - [ ] Press and hold, drag off button before threshold
   - [ ] Verify: long-click does not fire
### Cleanup

- [ ] Deprecate or remove `S_Mouse.clicks` if no longer used
- [ ] Final update `clicks.md` design doc to reflect centralized model
- [ ] Review per-component `Mouse_Timer` instances:
	 - [ ] `Events.mouse_timer_forName()` factory and `mouse_timer_dict_byName` — may be obsolete if all timing is centralized
	 - [ ] `Events.alterationTimer` — used for alteration; keep if still needed
	 - [ ] `Radial_Rings.svelte` calls `e.mouse_timer_forName(name).reset()` — review if still needed
