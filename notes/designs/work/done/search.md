# Search Bug Fixes

## Core problem

Reactive indirection causing infinite loops

## Pattern that broke things

- Store A subscription calls function X
- Function X sets store A (or another store whose subscription sets A)
- → Infinite loop

## Fixes applied

1. **`activate()` → `search_for()`**: Removed `w_s_search` subscription that called `search_for()`. Now `activate()` calls it directly. Direct causation, not reactive indirection.

2. **`search_for()` recursion**: Removed `this.activate()` call inside `search_for()` when query empty — mutual recursion with `activate()` calling `search_for()`.

3. **`w_show_search_controls` subscription**: Removed it entirely from `reactivity_subscribe()`. Search visibility is transient UI state controlled directly by `activate()`/`deactivate()`, not a persisted preference needing reactive side effects.

4. **`search_for()` setting visibility**: Removed `show.w_show_search_controls.set(...)` at end of `search_for()`. Separation of concerns — visibility is `activate()`/`deactivate()`'s job.

5. **Grabs not restored**: Added `si_saved_grabs` to save selection before search and restore on exit. Search temporarily overwrites grabs to show matches; exiting should restore original selection with correct index.

## Principle

When something needs to happen, call it directly. Subscriptions are for *reacting* to external changes, not for triggering side effects from your own actions.
