# Webseriously Internal Documentation

## Table of Contents

* [architecture](#architecture)
* [guides](#guides)
* [analysis](#analysis)

Brief summary of all design documentation, organized by folder.

## analysis

Notes taken during a feature addition or debugging session.

* [[./architecture/breadcrumbs.md]] - Breadcrumbs navigation system design and component integration
* [[focus]] - Focus management and ancestry tracking
* [[geometry]] - Geometric calculations and layout algorithms
* [[./refactor/layout.md]] - Layout system patterns and guidelines
* [[./refactor/clicks.md]] - Mouse click timing centralization refactoring patterns
* [[timers]] - Mouse timing centralization work and timer management
* [[widget_title]] - Widget title display and interaction patterns

## architecture

Comprehensive review of current overall design of components and interactions.

* [[./architecture/buttons.md]] - Button component hierarchy and SVG icon system
* [[./architecture/core/components.md]] - Component architecture: Svelte organization (11 directories) and Components manager
* [[controls]] - Control components and interaction patterns
* [[./architecture/database.md]] - Database abstraction layer and multi-backend support
* [[./architecture/geometry.md]] - Layout coordination and graph positioning
* [[./architecture/hits.md]] - Hit detection and mouse interaction architecture
* [[./architecture/managers.md]] - Singleton manager pattern and responsibilities
* [[./architecture/persistable.md]] - Persistable data models and serialization
* [[./architecture/preferences.md]] - User preferences and settings management
* [[./architecture/core/state.md]] - State management: state objects (S_*) and stores (w_*) architecture
* [[./architecture/styles.md]] - Styling system and CSS management

## guides

* [[./guides/debugging.md]] - Systematic debugging methodology and source verification principles
* [[./guides/gotchas.md]] - Common pitfalls and gotchas to avoid
* [[./guides/markdown.md]] - Markdown formatting guidelines and patterns
* [[./guides/refactoring.md]] - Refactoring principles and patterns
* [[./guides/style.md]] - Code style guidelines and conventions


