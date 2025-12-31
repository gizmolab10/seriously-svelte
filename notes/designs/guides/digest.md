# Design Documentation Digest

Quick overview of all design docs. Each section contains the synopsis that appears above the TOC in the corresponding file.

---

## Architecture

### [bubble.md](../architecture/bubble.md)

Bubble plugins are beasts. Webseriously runs in an iframe and uses postMessage to synchronize with bubble. Ugly stuff here, but it works.

### [components.md](../architecture/components.md)

S_Component objects hold state about user activity. Svelte sucks at this. The app needs to interact with the svelte components.

### [controls.md](controls.md)

The `lefts` array controls horizontal positioning of all the primary controls. Cumulative sum of widths, numeric key order matters. Want to move stuff around? This explains the system and how to reorder without breaking everything.

### [database.md](../architecture/database.md)

I built this to run on Firebase, Airtable, Local, and Test databases. They share a unified CRUD interface. It was almost a no-brainer to switch between them. Each database gets its own Hierarchy instance, so switching doesn't lose loaded data.

### [details.md](details.md)

The details panel shows info about whatever's currently selected or in focus. Collapsible sections, coordinated with UX manager. Also, how how the sections track what to show?

### [hits.md](../architecture/hits.md)

Only one element in the app can react to the mouse. That's just plain sensible. The **Hits** spatial index knows which one. It's the **single source of truth** for hover, click, autorepeat, long-click, and double-click. Consistent behavior everywhere.

### [paging.md](../architecture/paging.md)

Three clusters of widgets nestle around the radial ring. Often enough, there's not enough room. So, we show only a page at a time. The user can adjust the page. Lots of ghastly geometry goes into making it feel comfortable.

### [preferences.md](../architecture/preferences.md)

Okay, so I like to give people choices about looks and what have you. Of course their choices need to be remembered for them. It's a computer, for crying sake. This is a walk through how one preference flows from UI click to localStorage and back.

### [search.md](../architecture/search.md)

Instant search. Type a single letter and the matches appear instantly. Type more or choose one and done. economical use of screen real estate.

### [state.md](../architecture/state.md)

Svelte [[components]] are terrible at carrying state (most apps don't need it). my app does, a lot of it. thus, separate state objects. they have many flavors.

### [styles.md](../architecture/styles.md)

I admit it, my early code was a nightmare to tweak because i designed it as i went along. With AI, i crafted a centralized system. One place to confine the mess. Styles computes all colors from state snapshots. Remarkably simple code.

### [ux.md](../architecture/ux.md)

What's focused, what's grabbed, what's being edited, what to show in details. Stores and derived stores. Fast!

### [writables.md](../architecture/writables.md)

Each manager owns stores for its domain. Nice quick inventory.

---

## Analysis

### [breadcrumbs.md](../work/breadcrumbs re-compositioon.md)

Breadcrumbs show either ancestry path or navigation history. Three parts work together - selector, next/previous buttons, and the crumb buttons themselves. This doc maps out how they coordinate with UX manager to track history and restore grabs. Also includes migration plan to make w_ancestry_focus fully derived from si_recents index.

### [focus.md](focus.md)

Tracked down why w_ancestry_focus was undefined during G_TreeGraph initialization. Module load order got me - G_TreeGraph subscribes at load time before the initialization sequence runs. Added proper seeding and safeguards.

### [geometry.md](geometry.md)

Quick reference for who does what in layout. Geometry.ts coordinates, the G_* helpers do the actual math. Signals trigger rebuilds, stores trigger reactivity, direct calls when you need control.

### [refactor-clicks.md](../refactor/clicks.md)

Each component was managing its own timers - autorepeat here, long-click there, hover-leave everywhere. Moved it all into Hits manager. Components now declare intent ("I need autorepeat"), manager handles lifecycle. State survives re-renders because it lives on the target, not the component.

### [timers.md](timers.md)

Session notes from the mouse timing centralization work. Captured patterns and principles that emerged - declaration over management, state persistence, enum-based config. Use these sections as reference for future refactoring.

### [widget_title.md](widget_title.md)

Documented the editable title component before replacing it. Captures what it does (display, selection, inline editing, width measurement, hit detection) and how it coordinates with other systems. Completed replacement work.
