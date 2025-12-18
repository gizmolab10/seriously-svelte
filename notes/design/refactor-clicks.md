# Mouse Timing Centralization Refactor

## Architectural Pattern

### Before: Distributed Timing
```
Component → Own Timer → Manual Start/Stop → Component State
```
- Each component manages its own timer lifecycle
- State lives in component (lost on re-render)
- Duplicated logic across components
- Manual hover-leave handling per component

### After: Centralized Timing
```
Component → Declares Intent → Central Manager → Automatic Lifecycle
```
- Single manager owns all timers
- State persists on shared target (survives re-render)
- Logic centralized in one place
- Automatic hover-leave cleanup

## Core Principles

### 1. Declaration Over Management
**Components declare** what timing behavior they need, **not how** to manage it.

**Pattern:**
- Component sets properties on shared target: `mouse_detection`, `*_callback`
- Manager reads properties and handles timing automatically
- Component receives callbacks at appropriate times

### 2. State Persistence
**Timing state lives on the target**, not the component.

**Why:** Components can be destroyed/recreated during UI updates. Target persists.

**Properties:**
- `autorepeat_event` - Original event (for generating repeats)
- `autorepeat_isFirstCall` - Distinguishes initial from repeat
- `clicks` - Click count (for double-click detection)

### 3. Enum-Based Configuration
**Single enum replaces multiple boolean flags.**

**Benefits:**
- Enforces mutual exclusivity (autorepeat ≠ long-click)
- Allows combinations (double + long)
- Type-safe, self-documenting

### 4. Automatic Lifecycle
**Manager handles all timing lifecycle automatically.**

**Events:**
- Mouse down → Start appropriate timer(s)
- Mouse up → Stop/cancel all timers
- Hover leave → Cancel pending timers
- Timer fire → Invoke callback

### 5. Single Source of Truth
**One manager, one timer per timing type.**

**Timers:**
- `autorepeat_timer` - For all autorepeat operations
- `click_timer` - For long-click and double-click

**Stores:**
- `w_autorepeat` - Currently autorepeating target
- `w_longClick` - Currently waiting for long-click

## Migration Pattern

### Step 1: Remove Component Timer
```diff
- const mouseTimer = e.mouse_timer_forName(name);
- mouseTimer.autorepeat_start(id, callback);
- mouseTimer.autorepeat_stop();
```

### Step 2: Declare on Target
```ts
s_element.mouse_detection = T_Mouse_Detection.autorepeat;
s_element.autorepeat_callback = () => { /* action */ };
```

### Step 3: Remove Manual Lifecycle
```diff
- $: if (!isHovering && detect_autorepeat) {
-     mouseTimer.autorepeat_stop();
- }
```

## Key Abstractions

### Timing Types
- **Autorepeat**: Immediate + repeated calls while held
- **Long-click**: Single call after threshold
- **Double-click**: Defer first, fire on second within threshold

### State Transitions
```
Down → [Timer Start] → [Timer Fire] → [Callback] → Up → [Timer Stop]
  ↓
[Hover Leave] → [Timer Cancel]
```

## What Gets Deprecated

| Old Pattern | New Pattern |
|------------|-------------|
| `elements.s_mouse_forName(name)` | Fresh `S_Mouse` instances each time |
| `S_Mouse.clicks` (per-component) | `S_Hit_Target.clicks` (per-target) |
| `detect_autorepeat` boolean | `mouse_detection` enum |
| Component-owned timers | Centralized timers in manager |
| Manual hover-leave reactive statements | Automatic cleanup in manager |

## Benefits

1. **Survives Re-renders**: State on target persists across component recreation
2. **Consistent Behavior**: All timing works the same way
3. **Automatic Cleanup**: Hover-leave handled centrally
4. **Easier Debugging**: Inspect stores to see active targets
5. **Less Code**: Components declare, don't manage

## Implementation Notes

- **Manager**: `Hits.ts` owns all timing logic
- **Target**: `S_Hit_Target` holds timing state and callbacks
- **Configuration**: `T_Mouse_Detection` enum declares timing type
- **Visual Feedback**: Stores (`w_autorepeat`, `w_longClick`) drive CSS
- **Event Flow**: `handle_click_at` → detects type → starts timer → fires callback
