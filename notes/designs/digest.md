# Design Documentation Digest

Quick overview of all design docs. Each section contains the synopsis from the corresponding file. Architecture is the "what and why," guides are the "how."

---

## Architecture

### Core

Foundation of webseriously's data model and system behavior.

#### [components.md](./architecture/core/components.md)

Webseriously's component system has two layers: Svelte components organized by purpose, and a Components manager that tracks state objects for complex interactive components. Simple elements use S_Element, complex ones use S_Component.

#### [databases.md](./architecture/core/databases.md)

I built this to run on Firebase, Airtable, Local, and Test databases. They share a unified CRUD interface. Each database gets its own Hierarchy instance, so live-switching doesn't lose loaded data.

#### [geometry.md](./architecture/core/geometry.md)

Quick reference for who does what in layout. Geometry.ts coordinates, the G_* helpers do the actual math. Signals trigger rebuilds, stores trigger reactivity, direct calls when you need control.

#### [hits.md](./architecture/core/hits.md)

Only one element in the app can react to the mouse. The Hits spatial index knows which one. Single source of truth for hover and click dispatch. Consistent behavior everywhere.

#### [managers.md](./architecture/core/managers.md)

Webseriously uses 16 singleton managers to coordinate different aspects of the application. Each manager has a specific responsibility and provides a centralized API for its domain.

#### [state.md](./architecture/core/state.md)

Each state object is a single source of truth. Hybrid approach: state objects (S_* classes) for persistent state that survives component recreation, plus Svelte stores (w_* writables) for reactivity. Specialized approach for a tightly integrated reactive system.

#### [ux.md](./architecture/core/ux.md)

What's focused, what's grabbed, what's being edited, what to show in details. Stores and derived stores. Fast!

---

### More

Additional architecture topics.

#### [persistable.md](./architecture/more/persistable.md)

All persistent data entities extend the Persistable base class. Provides unified interface for database operations, serialization, and identity management.

#### [reactivity.md](./architecture/more/reactivity.md)

How reactivity works in Svelte 4. Not about stores, not about Svelte 5 runes. Just plain old component state and the weirdness i kept seeing in the codebase.

#### [styles.md](./architecture/more/styles.md)

i admit it, my early code was a nightmare to tweak because i designed it as i went along. With AI, i crafted a centralized system. One place to confine the mess. Styles computes all colors from state snapshots. Remarkably simple code.

#### [timers.md](./architecture/more/timers.md)

Mouse timing logic centralized in Hits manager. Components declare intent ("I need autorepeat"), manager handles lifecycle. State survives re-renders because it lives on the target, not the component.

---

### UX

User experience components and interaction patterns.

#### [breadcrumbs.md](./architecture/ux/breadcrumbs.md)

Breadcrumbs show either ancestry path or navigation history. Three parts work together - selector, next/previous buttons, and the crumb buttons themselves. Maps out how they coordinate with UX manager to track history and restore grabs.

#### [buttons.md](./architecture/ux/buttons.md)

These just cropped up, ad-hoc, at the beginning of the project. Component hierarchy from base Button to specialized variants. SVG configuration data flow. Might give it a sanity check.

#### [controls.md](./architecture/ux/controls.md)

The `lefts` array controls horizontal positioning of all the primary controls. Cumulative sum of widths, numeric key order matters. Want to move stuff around? This explains the system and how to reorder without breaking everything.

#### [details.md](./architecture/ux/details.md)

The details panel shows info about whatever's currently selected or in focus. Collapsible sections, coordinated with UX manager. Also, how the sections track what to show.

#### [paging.md](./architecture/ux/paging.md)

Three clusters of widgets nestle around the radial ring. Often enough, there's not enough room. So, we show only a page at a time. The user can adjust the page. Lots of ghastly geometry goes into making it feel comfortable.

#### [preferences.md](./architecture/ux/preferences.md)

Okay, so i like to give people choices about looks and what have you. Of course their choices need to be remembered for them. It's a computer, for crying sake. This is a walk through how one preference flows from UI click to localStorage and back.

#### [search.md](./architecture/ux/search.md)

Instant search. Type a single letter and the matches appear instantly. Type more or choose one and done. Economical use of screen real estate.

#### [titles.md](./architecture/ux/titles.md)

Documented the editable title component before replacing it. Captures what it does (display, selection, inline editing, width measurement, hit detection) and how it coordinates with other systems.

---

### Other

Additional architectural bits that don't fit elsewhere.

#### [bubble.md](./architecture/further/bubble.md)

Bubble plugins are beasts. Webseriously runs in an iframe and uses postMessage to synchronize with Bubble. Ugly stuff here, but it works.

#### [svelte.5.md](./architecture/further/svelte.5.md)

How to upgrade from Svelte 4 to 5. The runes are coming. Reactivity works completely differently. Decision: not upgrading for now.

#### [vitepress.md](./architecture/further/vitepress.md)

Publishing web documentation. Instructions for installing, configuring and running VitePress in a way that i could understand it and Claude could read it and do it.

---

## Guides

For my own sanity and to save immense time composing queries for AI, i asked it to summarize various activities that i want it to perform often enough.

#### [access.md](./guides/access.md)

Quick guide for setting up Claude Desktop to access your local filesystem. Why it matters, setup steps, troubleshooting MCP disconnect errors.

#### [chat.md](./guides/chat.md)

A guide to defining problems, setting goals, and tracking your approach through to resolution. The basic flow for productive conversations with Claude.

#### [composition.md](./guides/composition.md)

Props-down, events-up. Slots for flexible content. Compound components for complex UIs. Wanted to document the pattern and see where we could use it better.

#### [debugging.md](./guides/debugging.md)

i asked the AI to write what it had learned while going around in circles, unable to consider venturing outside the box. Two critical principles: verify source first, be systematic.

#### [gotchas.md](./guides/gotchas.md)

One day, i edited some code and later, i ran the app. Ack, i get this cryptic error: `if_block.p is not a function`. Asked AI to investigate, resolve and summarize.

#### [markdown.md](./guides/markdown.md)

Anchor strategy for creating md files. Stable anchor targets, inline problems and goals, summary sections. Might be a hack but it's the first attempt to formalize the material.

#### [migration.md](./guides/migration.md)

How to create effective migration documents for component refactors. Break big changes into small phases, document decisions, track progress.

#### [refactoring.md](./guides/refactoring.md)

Code debt. Snarly, ad-hoc, organically fussed with, temperamental. Man crawling across the desert, barely able to say "refactor, need refactor." Guidelines compiled from AI sessions.

#### [style.md](./guides/style.md)

Codebase idiosyncrasies. All the naming conventions, formatting rules, and ordering patterns. Follow these strictly to maintain consistency.

#### [voice.md](./guides/voice.md)

Captures my writing style for documentation. The goal: docs that sound like me, Jonathan, not like a technical writer. First person, problem first, casual language.
