# Timer Project Summary

This document summarizes the mouse timing centralization work and related refactoring patterns established during this session. Use section references like "do X like section Y in timer-project" to apply these patterns to future work.

## Mouse Timing Centralization

### Overview
Centralized all mouse timing logic (autorepeat, long-click, double-click, click counting) from per-component management into `Hits.ts` manager. Components now **declare** timing needs rather than **managing** timers.

### Key Pattern: Declaration Over Management
**Components declare intent, manager handles execution.**

**Before:**
- Each component owned its own `Mouse_Timer`
- Components manually started/stopped timers
- State lived in component (lost on re-render)
- Duplicated logic across components

**After:**
- Components set properties on `S_Hit_Target`: `mouse_detection`, `autorepeat_callback`, `longClick_callback`, `doubleClick_callback`
- `Hits.ts` reads properties and handles all timing automatically
- State persists on `S_Hit_Target` (survives re-render)
- Single source of truth in `Hits.ts`

### Implementation Details

#### T_Mouse_Detection Enum
Replaced multiple boolean flags with single enum using bit flags:
- `T_Mouse_Detection.autorepeat` (mutually exclusive)
- `T_Mouse_Detection.doubleLong` (double | long, can combine)
- `T_Mouse_Detection.double`
- `T_Mouse_Detection.long`
- `T_Mouse_Detection.none`

Components set `mouse_detection={T_Mouse_Detection.autorepeat}` instead of `detect_autorepeat={true}`.

#### Centralized State
- `w_autorepeat`: Store tracking currently autorepeating target
- `w_longClick`: Store tracking target waiting for long-click
- `click_timer`: Single `Mouse_Timer` for long-click and double-click
- `autorepeat_timer`: Single `Mouse_Timer` for autorepeat
- State on `S_Hit_Target`: `autorepeat_event`, `autorepeat_isFirstCall`, `clicks`

#### Automatic Lifecycle
`Hits.ts` handles all timing automatically:
- Mouse down → Start appropriate timer(s)
- Mouse up → Stop/cancel all timers
- Hover leave → Cancel pending timers (automatic cleanup)
- Timer fire → Invoke callback

### Migration Pattern
1. Remove component timer (`mouse_timer_forName`)
2. Set properties on `S_Hit_Target`: `mouse_detection`, `*_callback`
3. Remove manual lifecycle code (start/stop/reset)
4. Test thoroughly (re-renders, rapid interactions, hover-leave)

### Files Modified
- `src/lib/ts/managers/Hits.ts` - Centralized timing logic
- `src/lib/ts/state/S_Hit_Target.ts` - Added `mouse_detection`, callbacks, state
- `src/lib/svelte/mouse/Button.svelte` - Migrated to declaration pattern
- Various components migrated to new pattern

### Documentation
- `notes/design/hits.md` - Complete architecture and migration guide
- `notes/design/refactoring-guide.md` - General refactoring principles (see "Example: Mouse Timing Centralization")

## Button Styling Fixes

### Problem
Several control buttons had incorrect fill colors (transparent instead of white) and incorrect text colors on hover.

### Solution Pattern: Color Hierarchy
1. **Source of truth**: `S_Element.ts` getters (`fill`, `stroke`, `asTransparent`)
2. **Configuration**: Set `color_background` on `S_Element` instances
3. **Getters respect configuration**: `fill` getter uses `color_background` as fallback

### Implementation
- Modified `Elements.s_control_forType()` to set `s_control.color_background = 'white'` for `T_Control.builds`, `T_Control.help`, `T_Control.search`
- Updated `S_Element.ts`:
  - `asTransparent` getter checks `this.subtype == T_Control.details` (for details toggle)
  - `fill` getter fallback changed from hardcoded `'white'` to `this.color_background`

### Files Modified
- `src/lib/ts/managers/Elements.ts` - Set `color_background` for controls
- `src/lib/ts/state/S_Element.ts` - Fixed `asTransparent` and `fill` getters

## Close Button Hit Testing (Unresolved)

### Problem
Close search button only responded to hover/click in tiny area at top-left corner, despite correct bounding rects in logs.

### Attempted Fixes
- Added `display: block` and `tick()` for layout completion
- Bypassed `set_html_element()` and set `html_element` directly
- Added logic to `delete_hit_target()` when element reference changed
- Removed duplicate entry prevention in `Hits.add_hit_target()`

### Status
Issue remains unresolved. User reverted changes. Root cause unclear - may be related to stale RBush entries or timing of rect updates.

### Files Involved
- `src/lib/svelte/mouse/Close_Button.svelte`
- `src/lib/ts/managers/Hits.ts`

## Documentation Patterns

### Refactoring Guide Pattern
Created `notes/design/refactoring-guide.md` with abstract principles for future refactoring:
- General Principles (centralization, declaration over management, state persistence, etc.)
- Refactoring Process (analysis → design → implementation → cleanup)
- Performance Optimization Principles
- Simplification Principles
- Migration Strategy
- Example section showing how principles apply

**Use this pattern**: When starting a new refactoring, create a guide document with principles and process, then add an example section showing how it applies to the current work.

### Geometry Documentation Pattern
Created `notes/design/geometry.md` documenting existing system:
- Design responsibilities of `Geometry.ts` and helpers
- All ways layout is invoked (signals, `grand_*` methods, reactive stores, direct calls)
- All types of actors that drive or are configured by layout

**Use this pattern**: Before refactoring, document the existing system's responsibilities, invocation patterns, and actors to understand what needs to be preserved.

### Layout Guide Pattern
Created `notes/design/layout-guide.md` as a working document for refactoring:
- Analysis Questions (what is scattered, state, lifecycle)
- Design Questions (what do components declare, how does manager compute)
- Simplification Opportunities (remove duplication, reduce complexity, clear abstractions)
- Performance Opportunities (batch operations, lazy evaluation, incremental updates)
- Summary section with problems/goals linked back to source sections

**Use this pattern**: Create a guide document with questions and opportunities, then populate it incrementally as you analyze and design.

### Markdown Anchor Pattern
Established pattern for linking problems/goals to their source sections (see `notes/design/markdown.md`):

1. **Create stable anchor targets**: Promote important bullets to subheaders (`####` or `#####`) so they have stable anchors
2. **Write problems/goals inline**: Under each heading, write `**Problem**` / `**Goal**` bullets near the code/concept
3. **Collect summary section**: At end, create `## Summary` with `### Problems` and `### Goals`
4. **Group by originating section**: For each heading with problems/goals, add `- From [[#Heading text]]` followed by copied bullets (strip `**Problem**:` / `**Goal**:` prefixes)
5. **Editing workflow**: When adding/editing problems/goals, update both the source section and the summary

**Use this pattern**: When documenting problems and goals, keep them inline with their context, then collect them in a summary with links back to source sections.

## Key Principles Established

### 1. Centralization Over Distribution
Move from scattered logic to single source of truth. One manager owns the responsibility.

### 2. Declaration Over Management
Components declare intent, manager handles execution. Set properties, receive callbacks.

### 3. State Persistence
State lives on persistent objects (like `S_Hit_Target`), not ephemeral components. Survives re-renders.

### 4. Enum-Based Configuration
Single enum replaces multiple boolean flags. Enforces mutual exclusivity or valid combinations.

### 5. Automatic Lifecycle
Manager handles all lifecycle automatically. Start/stop/cleanup on appropriate events.

### 6. Single Source of Truth
One manager, one timer/cache/state per concern. No conflicts, easier to reason about.

## Applying to Future Work

### For Layout Refactoring
- Use "Geometry Documentation Pattern" to document existing `Geometry.ts` system
- Use "Layout Guide Pattern" to create working document with questions/opportunities
- Apply principles from "Refactoring Guide Pattern" (centralization, declaration, state persistence)
- Use "Markdown Anchor Pattern" to document problems/goals with summary links

### For Other Refactorings
- Start with "Refactoring Guide Pattern" - create principles document
- Document existing system (like "Geometry Documentation Pattern")
- Create working guide with questions/opportunities (like "Layout Guide Pattern")
- Follow migration pattern: analysis → design → implementation → cleanup
- Use "Markdown Anchor Pattern" for documentation

