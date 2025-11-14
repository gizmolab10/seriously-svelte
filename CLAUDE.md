# CLAUDE.md - AI Assistant Guide for Webseriously

**Project**: webseriously
**Repository**: /Users/sand/GitHub/webseriously
**Last Updated**: 2025-11-14

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Key Architectural Patterns](#key-architectural-patterns)
4. [Naming Conventions](#naming-conventions)
5. [State Management](#state-management)
6. [Database Layer](#database-layer)
7. [Component Architecture](#component-architecture)
8. [Development Workflow](#development-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Build & Deployment](#build--deployment)
11. [Common Tasks](#common-tasks)
12. [Code Quality Guidelines](#code-quality-guidelines)

---

## Project Overview

**Webseriously** is a sophisticated hierarchical data visualization and management application built with Svelte 4.x and TypeScript. It provides interactive radial and tree graph visualizations for exploring complex hierarchical relationships.

### Tech Stack
- **Framework**: Svelte 4.x with SvelteKit 2.8.3
- **Language**: TypeScript 5.4.5 (ES6 target)
- **Build Tool**: Vite 4.3.2
- **UI Libraries**: Skeleton UI, Tailwind CSS, D3.js, Two.js
- **State Management**: Svelte stores + custom signal system
- **Databases**: Multi-backend (Firebase, Airtable, LocalStorage, Bubble.io)
- **Testing**: Jest with ts-jest and jsdom

### Project Scale
- **~20,285 total lines of code**
- **~13,469 lines of TypeScript**
- **~6,815 lines of Svelte components**
- **~60 TypeScript modules**
- **~75 Svelte components**

---

## Codebase Structure

```
webseriously/
├── src/                           # Main application source
│   ├── main.js                   # Entry point (mounts SeriouslyApp.svelte)
│   ├── styles/                   # Global SCSS/CSS
│   ├── assets/                   # Static images and icons
│   └── lib/
│       ├── ts/                   # TypeScript core (13,469 lines)
│       │   ├── common/           # Shared imports, enums, constants, extensions
│       │   ├── database/         # Database abstraction layer
│       │   ├── debug/            # Debug system with 40+ debug flags
│       │   ├── files/            # File I/O and pivot data handling
│       │   ├── layout/           # Graph layout & geometry calculations
│       │   ├── managers/         # State managers (Colors, Hierarchy, etc.)
│       │   ├── persistable/      # Data models (Thing, Trait, Relationship, etc.)
│       │   ├── runtime/          # Runtime objects (Ancestry, Identifiable)
│       │   ├── signals/          # Priority-based signal/event system
│       │   ├── state/            # Svelte writable stores (13 store classes)
│       │   ├── tests/            # Jest test suite
│       │   ├── types/            # TypeScript type definitions
│       │   ├── utilities/        # Helper utilities
│       │   └── ux/               # UX coordination layer
│       ├── svelte/               # Svelte components (6,815 lines)
│       │   ├── main/             # Main app & layout
│       │   ├── graph/            # Graph visualization (Radial, Tree)
│       │   ├── widget/           # Node/widget rendering
│       │   ├── controls/         # UI controls
│       │   ├── details/          # Detail panel
│       │   ├── mouse/            # Mouse interactions
│       │   ├── draw/             # SVG drawing
│       │   ├── search/           # Search functionality
│       │   ├── text/             # Text editing
│       │   └── experimental/     # Experimental components
│       └── js/                   # JavaScript entry points
├── bubble/                       # Bubble.io plugin integration
│   ├── initialize.js             # Plugin initialization
│   ├── update.js                 # State sync
│   └── [event handlers]          # Focus, selection, mode changes
├── notes/                        # Documentation & design notes
│   ├── design/                   # Design documents
│   │   ├── slim/                 # State management refactor proposal
│   │   └── *.md                  # Architecture docs
│   └── experiments/              # Experimental code
├── public/                       # Static assets
└── [config files]                # Build/lint/test configuration
```

---

## Key Architectural Patterns

### 1. Centralized Singleton Management

The application uses singleton instances for all major subsystems, exported via `Global_Imports.ts`:

```typescript
import {
  s,           // State singleton (all writable stores)
  h,           // Hierarchy manager
  c,           // Configuration
  p,           // Preferences
  k,           // Constants
  u,           // Utilities
  x,           // UX helpers
  e,           // Events
  layout,      // Layout manager
  colors,      // Color manager
  search,      // Search manager
  show,        // Visibility manager
  signals,     // Signal system
  databases    // Database manager
} from '../common/Global_Imports'
```

### 2. Priority-Based Signal System

Components communicate through a priority-based signal/event system defined in `src/lib/ts/signals/Signals.ts`:

- **Signal Types**: `T_Signal.rebuild`, `T_Signal.reattach`, `T_Signal.reposition`, `T_Signal.alteration`
- **Priority Levels**: 0-N (lower = higher priority)
- **Handler Registration**: Components register handlers at specific priorities
- **Execution Order**: Signals execute all handlers in priority order

**Example**:
```typescript
signals.handle_signals_atPriority(
  [T_Signal.reattach],
  0,
  ancestry,
  T_Component.radial,
  (signal, value) => { /* handler */ }
);
```

### 3. Hierarchical Data Model

Core data entities (in `src/lib/ts/persistable/`):

- **Thing**: Main hierarchical objects with title, color, type
- **Trait**: Properties/attributes of Things
- **Relationship**: Parent-child and other connections (uses Predicates)
- **Predicate**: Defines relationship types
- **Tag**: Labels for categorization
- **User**: User accounts
- **Access**: Permissions

### 4. Multi-Database Abstraction

Database layer (`src/lib/ts/database/`) supports multiple backends:

- **DB_Airtable**: REST API integration
- **DB_Bubble**: Iframe-based plugin communication
- **DB_Firebase**: Real-time database with auth
- **DB_Local**: LocalStorage + IndexedDB
- **DB_Test**: In-memory testing database

All inherit from `DB_Common.ts` which defines polymorphic CRUD operations.

### 5. Dual Build Modes

Configured in `vite.config.js`:

- **App Mode** (default): Full standalone Svelte application
- **Plugin Mode**: `BUILD_TARGET=plugin` - Builds Bubble.io iframe plugin to `dist/plugin/`

---

## Naming Conventions

**Critical**: Follow these strict naming conventions defined in README.md:

### Prefixes

| Prefix | Usage | Example |
|--------|-------|---------|
| `T_` | Types, Enums, Interfaces | `T_Signal`, `T_Graph`, `T_Component` |
| `w_` | Writable store variables | `w_ancestry_focus`, `w_thing_title` |
| `S_` | State class names | `S_Alteration`, `S_Mouse`, `S_Widget` |
| `G_` | Geometry/Layout classes | `G_Widget`, `G_RadialGraph`, `G_Paging` |

### Singleton Abbreviations

| Variable | Singleton | Module |
|----------|-----------|--------|
| `s` | State | `src/lib/ts/state/State.ts` |
| `h` | Hierarchy | `src/lib/ts/managers/Hierarchy.ts` |
| `c` | Configuration | `src/lib/ts/managers/Configuration.ts` |
| `p` | Preferences | `src/lib/ts/managers/Preferences.ts` |
| `k` | Constants | `src/lib/ts/common/Constants.ts` |
| `u` | Utilities | `src/lib/ts/utilities/Utilities.ts` |
| `x` | UX Items | `src/lib/ts/ux/UX_S_Items.ts` |
| `e` | Events | `src/lib/ts/signals/Events.ts` |

### General Conventions

- **PascalCase**: Classes, Types, Enums, Components
- **camelCase**: Functions, variables, methods
- **snake_case**: With prefix convention (e.g., `w_thing_title`)
- **SCREAMING_SNAKE_CASE**: Constants (rare, mostly in `k`)

---

## State Management

### Store Organization

All state is centralized in `State.ts` (`src/lib/ts/state/State.ts`), organized into logical groups:

#### THING Group
```typescript
w_thing_fontFamily       // Current thing's font
w_thing_title            // Current thing's title
w_relationship_order     // Relationship ordering
w_s_alteration           // Add/delete operation tracking
w_s_title_edit           // Text editing state
```

#### ANCESTRY Group
```typescript
w_hierarchy              // Hierarchy manager instance
w_ancestry_focus         // Currently focused ancestry path
w_ancestry_forDetails    // Ancestry for detail panel
```

#### COUNTS Group
```typescript
w_count_mouse_up         // Mouse up event counter
w_count_rebuild          // Graph rebuild counter
w_count_window_resized   // Resize event counter
w_count_details          // Detail panel update counter
```

#### OTHER Group
```typescript
w_t_startup              // App lifecycle (start → fetch → empty → ready)
w_auto_adjust_graph      // Auto-adjustment state
w_s_hover                // Hover element state
w_popupView_id           // Popup view identifier
w_dragging_active        // Drag operation state
w_control_key_down       // Control key state
w_device_isMobile        // Mobile device detection
w_font_size              // Current font size
```

### Store Usage Pattern

**Import and destructure**:
```typescript
import { s } from '../common/Global_Imports'

const { w_ancestry_focus, w_thing_title } = s;
```

**Subscribe in Svelte components**:
```svelte
<script>
  import { s } from '../../ts/common/Global_Imports';
  const { w_ancestry_focus, w_thing_title } = s;
</script>

{#if $w_ancestry_focus.thing}
  <h1>{$w_ancestry_focus.thing.title}</h1>
{/if}
```

**Update stores**:
```typescript
s.w_thing_title.set('New Title');
s.w_ancestry_focus.update(a => new_ancestry);
```

### Specialized Store Classes

Located in `src/lib/ts/state/`:

- `S_Alteration.ts` - Track add/delete operations
- `S_Busy.ts` - Loading/persistence status
- `S_Component.ts` - Component lifecycle and signal handlers
- `S_Element.ts` - UI element state
- `S_Items.ts` - Generic list management
- `S_Mouse.ts` - Mouse event data
- `S_Persistence.ts` - Per-object persistence status
- `S_RadialGraph.ts` - Radial graph state
- `S_Resizing.ts` - Resize state
- `S_Rotation.ts` - Rotation/angle state
- `S_Title_Edit.ts` - Text editing state
- `S_Widget.ts` - Widget rendering state

---

## Database Layer

### Database Manager Usage

Import the singleton:
```typescript
import { databases } from '../common/Global_Imports'
```

### CRUD Operations

All database operations are polymorphic across types:

```typescript
// Create
await databases.create_thing(thing);
await databases.create_trait(trait);
await databases.create_relationship(relationship);

// Read
const thing = await databases.read_thing(id);
const traits = await databases.read_traits_for(thing_id);

// Update
await databases.update_thing(thing);

// Delete
await databases.delete_thing(id);
```

### Persistence Modes

Configured via `T_Persistence` enum:
- `T_Persistence.remote` - Firebase/Airtable/Bubble
- `T_Persistence.local` - LocalStorage/IndexedDB
- `T_Persistence.none` - No persistence (testing)

### Deferred Persistence

The system supports auto-save with deferred batch updates:
```typescript
thing.mark_dirty();  // Mark for persistence
// System will batch and persist automatically
```

---

## Component Architecture

### Application Flow

```
index.html
  ↓
src/main.js
  ↓
src/lib/svelte/main/SeriouslyApp.svelte
  ↓
src/lib/svelte/main/Panel.svelte (main layout)
  ├── Primary_Controls.svelte
  ├── Breadcrumbs.svelte
  ├── Graph.svelte (delegates to Radial_Graph or Tree_Graph)
  ├── Details.svelte
  └── Search.svelte
```

### Key Components

#### Main Layout (`src/lib/svelte/main/`)
- `SeriouslyApp.svelte` - Entry point, calls `c.configure()`
- `Panel.svelte` - Main layout orchestrator

#### Graph Visualization (`src/lib/svelte/graph/`)
- `Graph.svelte` - Router for graph types
- `Radial_Graph.svelte` - Radial visualization with concentric rings
- `Radial_Rings.svelte` - Background rings
- `Radial_Focus.svelte` - Center focus widget
- `Tree_Graph.svelte` - Tree view alternative
- `Widget.svelte` - Individual node rendering with drag support

#### Controls (`src/lib/svelte/controls/`)
- `Primary_Controls.svelte` - Main button bar
- `Secondary_Controls.svelte` - Secondary actions
- `Breadcrumbs.svelte` - Navigation trail
- `Slider.svelte` - Value slider with arc geometry
- Various button components (Triangle_Button, Glow_Button, etc.)

#### Details Panel (`src/lib/svelte/details/`)
- `Details.svelte` - Container
- `D_Header.svelte`, `D_Data.svelte`, `D_Actions.svelte` - Layout sections
- `D_Selection.svelte`, `D_Tags.svelte`, `D_Traits.svelte` - Data displays
- `D_Preferences.svelte` - Thing-specific settings

### Component Signal Handling

Components should register signal handlers in `onMount`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { signals, T_Signal, T_Component } from '../../ts/common/Global_Imports';

  onMount(() => {
    signals.handle_signals_atPriority(
      [T_Signal.reattach, T_Signal.reposition],
      0,
      ancestry,
      T_Component.radial,
      (signal, value) => {
        if (signal === T_Signal.reattach) {
          // Handle reattach
        } else if (signal === T_Signal.reposition) {
          // Handle reposition
        }
      }
    );
  });
</script>
```

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build (port 8080)
npm run preview

# Generate documentation
npm run docs
```

### Code Style

**Prettier configuration** (`.prettierrc`):
- Tabs: Spaces (2 spaces)
- Quotes: Single quotes
- Trailing commas: None
- Print width: 100
- Tab width: 2

Format code before committing:
```bash
npx prettier --write "src/**/*.{ts,svelte,js}"
```

### Import Best Practices

**Always use `Global_Imports.ts`** for internal modules:

```typescript
// ✅ GOOD
import { s, h, c, Thing, Ancestry, signals } from '../common/Global_Imports';

// ❌ BAD
import { s } from '../state/State';
import { h } from '../managers/Hierarchy';
import Thing from '../persistable/Thing';
```

**Benefits**:
- Single source of truth for imports
- Easier refactoring
- Consistent across codebase
- Barrel export pattern

### Debug System

Enable debug flags in `src/lib/ts/debug/Debug.ts`:

```typescript
import { debug, T_Debug } from '../common/Global_Imports';

// Enable specific debug category
debug.set(T_Debug.signals, true);

// Check if debug enabled
if (debug.get(T_Debug.layout)) {
  console.log('Layout debug info');
}
```

**40+ debug categories available**: signals, layout, persistence, hierarchy, components, etc.

---

## Testing Strategy

### Test Configuration

- **Framework**: Jest with ts-jest preset
- **Environment**: jsdom (browser simulation)
- **Test Files**: `src/lib/ts/tests/slim/**/*Test.ts` and `*.test.ts`

### Test Structure

```
src/lib/ts/tests/
├── slim/
│   ├── core/           # Foundation tests
│   ├── e2e/            # End-to-end tests
│   ├── integration/    # Integration tests
│   ├── migration/      # Phased refactoring tests (Phase 1-4)
│   └── utils/          # Test utilities
├── Colors.test.ts
├── Geometry.test.ts
└── serializers.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest src/lib/ts/tests/Geometry.test.ts

# Run with coverage
npx jest --coverage

# Watch mode
npx jest --watch
```

### Writing Tests

Follow existing patterns in `tests/slim/`:

```typescript
import { describe, it, expect } from '@jest/globals';
import Thing from '../../persistable/Thing';

describe('Thing', () => {
  it('should create a thing with title', () => {
    const thing = new Thing();
    thing.title = 'Test Thing';
    expect(thing.title).toBe('Test Thing');
  });
});
```

---

## Build & Deployment

### Build Modes

#### App Mode (Default)
```bash
npm run build
```
- Builds full Svelte application
- Output: `dist/`
- Includes all Svelte components and assets

#### Plugin Mode
```bash
BUILD_TARGET=plugin npm run build
```
- Builds Bubble.io iframe plugin
- Entry: `bubble/initialize.ts`
- Output: `dist/plugin/bubble-plugin.js`
- Format: ES module
- Source maps enabled

### Deployment

**Netlify** configuration in `netlify.toml`:
- Sets CSP headers for Airtable API access
- Automatic deployment on push to main

### Environment Variables

Configuration via query strings (handled by `Configuration.ts`):
- `?theme=dark` - Dark mode
- `?disable_features=X` - Disable specific features
- Custom parameters parsed in `c.configure()`

---

## Common Tasks

### Adding a New Component

1. Create component in appropriate `src/lib/svelte/` subdirectory
2. Import required singletons from `Global_Imports`
3. Register signal handlers if needed
4. Export from parent module if necessary

```svelte
<script lang='ts'>
  import { s, signals, T_Signal, T_Component } from '../../ts/common/Global_Imports';
  import { onMount } from 'svelte';

  const { w_ancestry_focus } = s;

  onMount(() => {
    signals.handle_signals_atPriority(
      [T_Signal.rebuild],
      1,
      null,
      T_Component.my_component,
      (signal) => {
        // Handle rebuild
      }
    );
  });
</script>

<div>
  {$w_ancestry_focus.thing?.title}
</div>
```

### Adding a New Data Model

1. Create class extending `Persistable` in `src/lib/ts/persistable/`
2. Add type to `T_Persistable` enum in `Enumerations.ts`
3. Add CRUD methods to `DB_Common.ts`
4. Implement in each database backend
5. Add to hierarchy tracking in `Hierarchy.ts` if hierarchical
6. Export from `Global_Imports.ts`

### Adding a New Store

1. Create store class in `src/lib/ts/state/` (e.g., `S_MyFeature.ts`)
2. Add writable property to `State.ts` class
3. Add to appropriate symbol-grouped section
4. Export class from `Global_Imports.ts`
5. Document usage

### Adding a New Manager

1. Create manager class in `src/lib/ts/managers/`
2. Implement as singleton with private constructor
3. Export singleton instance from module
4. Add to `Global_Imports.ts` exports
5. Add singleton abbreviation if needed

### Modifying the Hierarchy

The `Hierarchy` manager (`src/lib/ts/managers/Hierarchy.ts`) is complex with 20+ index structures:

- **Adding new index**: Update `thing_remember()` or `relationship_remember()` methods
- **Querying**: Use existing lookup methods like `things_for()`, `relationships_for()`
- **Updating**: Call `thing_forget()` then `thing_remember()` for changes

**Caution**: Hierarchy is performance-critical with heavy indexing. Test thoroughly.

### Working with Signals

```typescript
// Emit a signal
signals.emit(T_Signal.rebuild, ancestry);

// Register handler
const handler_id = signals.handle_signals_atPriority(
  [T_Signal.rebuild, T_Signal.reposition],
  priority_level,     // 0 = highest priority
  context_object,     // Context for filtering
  T_Component.type,   // Component type
  (signal, value) => {
    // Handle signal
  }
);

// Unregister handler (usually not needed, handled by component lifecycle)
signals.remove_handler(handler_id);
```

---

## Code Quality Guidelines

### TypeScript Best Practices

1. **Enable strict mode**: Already configured in `tsconfig.json`
2. **Avoid `any`**: Use proper types or `unknown`
3. **Use enums**: Defined in `Enumerations.ts` with `T_` prefix
4. **Type imports**: Use `import type` for type-only imports when possible
5. **Null safety**: Use optional chaining `?.` and nullish coalescing `??`

### Svelte Best Practices

1. **Reactive declarations**: Use `$:` for derived state
2. **Store subscriptions**: Use `$` prefix for auto-subscription
3. **Component props**: Type with TypeScript
4. **Lifecycle**: Use `onMount` for initialization, `onDestroy` for cleanup
5. **Events**: Prefer stores over event forwarding for cross-component communication

### Performance Considerations

1. **Lazy geometry**: Defer layout calculations until needed
2. **Signal batching**: Signals are batched and executed by priority
3. **Index lookups**: Hierarchy maintains inverse indexes for O(1) lookups
4. **Component reuse**: Widgets are reused in radial/tree views
5. **Pagination**: Use `G_Paging` for large hierarchies

### Security Considerations

1. **XSS Prevention**: Svelte automatically escapes content; use `{@html}` sparingly
2. **Database access**: All CRUD goes through abstraction layer
3. **User auth**: Handled by Firebase or Bubble.io
4. **CSP headers**: Configured in `netlify.toml`

### Documentation

1. **JSDoc comments**: Use for public APIs
2. **Inline comments**: Explain complex logic
3. **Design docs**: Add to `notes/design/` for architectural decisions
4. **TypeDoc**: Run `npm run docs` to generate API documentation

### Git Workflow

**Recent commits show patterns**:
- Feature commits: "implement replace hierarchy", "add plugin support for..."
- Refactor commits: "refactor restore_preferences for p, show, layout"
- Fix commits: "fixed claude confusion"
- Merge commits: PRs reviewed before merge

**Best practices**:
- Descriptive commit messages
- Small, focused commits
- Test before committing
- Run prettier before committing

---

## Current Refactoring: Project Slim

**Status**: In progress (see `notes/design/slim/`)

**Goal**: Simplify state management by:
1. Moving from priority-based signals to explicit state machines
2. Consolidating scattered stores into unified `SlimStore`
3. Maintaining ordering guarantees
4. Phased migration approach (Phase 1-4)

**What to know**:
- Tests in `src/lib/ts/tests/slim/` track migration progress
- Both old and new systems may coexist during transition
- Avoid adding new priority-based signal dependencies
- Consult `notes/design/slim/slim.md` for details

**Migration phases**:
- **Phase 1**: StateMachine implementation
- **Phase 2**: Signals integration
- **Phase 3**: Bridge between old/new systems
- **Phase 4**: Parallel operation

---

## Troubleshooting

### Common Issues

**Build fails with type errors**:
- Run `npm run build` to see full error output
- Check `tsconfig.json` for strict settings
- Verify imports from `Global_Imports.ts`

**Components not updating**:
- Verify store subscriptions with `$` prefix
- Check signal handler registration
- Ensure proper signal emission

**Layout issues**:
- Check `Layout.ts` for grand_layout() calls
- Verify geometry calculations in `G_*` classes
- Enable layout debug: `debug.set(T_Debug.layout, true)`

**Database not persisting**:
- Check `T_Persistence` mode
- Verify database configuration in `Configuration.ts`
- Check browser console for API errors
- Ensure `mark_dirty()` called on changes

### Debug Tools

```typescript
// Enable comprehensive debugging
import { debug, T_Debug } from '../common/Global_Imports';

debug.set(T_Debug.signals, true);
debug.set(T_Debug.layout, true);
debug.set(T_Debug.persistence, true);
debug.set(T_Debug.hierarchy, true);
```

### Getting Help

1. Check `notes/design/` for architectural documentation
2. Review similar components in codebase
3. Run tests to understand expected behavior
4. Generate TypeDoc: `npm run docs`
5. Check recent commits for similar changes

---

## Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| `src/main.js` | Application entry point |
| `src/lib/ts/common/Global_Imports.ts` | Central import barrel |
| `src/lib/ts/state/State.ts` | Centralized state stores |
| `src/lib/ts/managers/Hierarchy.ts` | Hierarchical data management |
| `src/lib/ts/signals/Signals.ts` | Signal system |
| `src/lib/ts/database/Databases.ts` | Database manager |
| `src/lib/svelte/main/SeriouslyApp.svelte` | Root component |
| `vite.config.js` | Build configuration |
| `package.json` | Dependencies and scripts |

### Essential Commands

```bash
npm run dev          # Start dev server (:5173)
npm run build        # Build production app
npm test             # Run tests
npm run docs         # Generate TypeDoc
npm run preview      # Preview build (:8080)
```

### Essential Imports

```typescript
// Singleton managers
import { s, h, c, p, k, u, x, e } from '../common/Global_Imports';

// System components
import { signals, layout, colors, search, show, databases } from '../common/Global_Imports';

// Data models
import { Thing, Trait, Relationship, Predicate, Tag, User, Access } from '../common/Global_Imports';

// Runtime
import { Ancestry } from '../common/Global_Imports';

// Types
import { T_Signal, T_Component, T_Graph, T_Persistable } from '../common/Global_Imports';

// Geometry
import { Point, Size, Rect, Angle } from '../common/Global_Imports';
```

---

## Philosophy & Design Principles

1. **Single Source of Truth**: State flows through singleton managers
2. **Explicit Over Implicit**: Signal system makes data flow visible
3. **Performance Through Indexing**: Heavy indexing for fast lookups
4. **Flexibility Through Abstraction**: Multi-database, multi-view support
5. **Progressive Enhancement**: Works standalone or as embedded plugin
6. **Type Safety**: Comprehensive TypeScript coverage
7. **Reactive by Default**: Svelte stores for automatic UI updates

---

## Additional Resources

- **Design Documents**: `notes/design/`
- **API Documentation**: Run `npm run docs`, view in browser
- **Component Examples**: `src/lib/svelte/*/`
- **Test Examples**: `src/lib/ts/tests/`
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Svelte Tutorial**: https://svelte.dev/tutorial
- **D3 Documentation**: https://d3js.org/

---

**Document Version**: 1.0
**Generated**: 2025-11-14
**For**: AI Assistants (Claude, GPT, etc.)

When working with this codebase, always:
1. Follow naming conventions strictly
2. Use `Global_Imports.ts` for imports
3. Register signal handlers properly
4. Update tests when changing behavior
5. Run prettier before committing
6. Check `notes/design/` for architectural context
