# Webseriously Project


**Webseriously** is a sophisticated Svelte-based visualization and data management application with hierarchical graph displays, interactive UI components, and multi-database support. Can be embedded as a Bubble.io plugin or run standalone.

Deeper Dives, beyond the scope off this file, [can be found here](documentation).
## Table of Contents
- [Project Overview](#project-overview)
  - [Naming Conventions](#naming-conventions)
  - [Directory Structure](#directory-structure)
  - [Core Concepts](#core-concepts)
  - [Key Features](#key-features)
  - [Architecture & Patterns](#architecture--patterns)
- [Development](#development)
  - [Setup](#setup)
  - [Code Style](#code-style)
  - [Important Files](#important-files)
  - [Debugging](#debugging)
  - [Gotchas](#gotchas)
- [Notes](#notes)
  - [DO / DON'T](#do--dont)
  - [Additional Resources](#additional-resources)

This document provides comprehensive guidance for anyone working on the Webseriously project.

## Project Overview

- **Package**: `webseriously`
- **Repository**: `gizmolab10/seriously-svelte`
- **Framework**: Svelte 4 + SvelteKit 2.8.3 + Vite
- **Language**: TypeScript (strict mode)
- **Node**: ^20.19.0
- **Deployment**: Netlify (https://webseriously.netlify.app)

**Tech Stack**: Svelte 4, TypeScript, Tailwind CSS + SCSS, Skeleton Labs, D3.js v7, Two.js, InteractJS, Vitest + Jest

**Databases**: Firebase, Airtable, Bubble, Local (IndexedDB/Dexie), Neo4j, PostgreSQL, RxDB, Test (in-memory). Switch via `?db=local|firebase|airtable|bubble`

### Naming Conventions

**Critical - Follow strictly:**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `T_` | Types/Enums | `T_Trait`, `T_Startup` |
| `w_` | Svelte Stores | `w_hierarchy`, `w_ancestry_focus` |
| `S_` | State Classes | `S_Widget`, `S_Element` |
| `G_` | Geometry | `G_Point`, `G_Cluster` |
| `k` | Constants instance | `k.empty`, `k.hashLength` |
| `h` | Hierarchy manager | `h.thing_forHID()` |
| `g` | Geometry manager | `g.layout()` |
| `p` | Preferences manager | `p.get()` |
| `x` | UX manager | `x.w_ancestry_focus` |
| `core` | Core manager | `core.w_hierarchy` |

**Variables**: `is_`, `has_`, `should_` (booleans), `_id`/`ID` (identifiers), `count_` (counters)

### Directory Structure

```
src/lib/
├── svelte/          # UI Components (~72 files)
│   ├── controls/    # Sliders, buttons, inputs
│   ├── details/     # Detail panels
│   ├── main/        # SeriouslyApp, Panel
│   ├── mouse/       # Mouse interaction
│   ├── radial/      # Radial graph
│   ├── tree/        # Tree graph
│   └── widget/      # Widget system
└── ts/              # TypeScript core (~88 files)
    ├── common/      # Constants, extensions
    ├── database/    # DB abstraction
    ├── geometry/    # Layout algorithms
    ├── managers/    # Singleton managers
    ├── persistable/ # Data models
    ├── state/       # State management
    └── types/       # Type definitions

bubble/              # Bubble.io plugin (JavaScript)
notes/designs/       # Design documentation
```

### Core Concepts

**Data Model**: Things (hierarchical nodes), Tags (categorization), Traits (key-value properties), Ancestries (parent-child paths), Relationships (typed links)

**Hierarchy System**:
```typescript
import { h } from '$lib/ts/common/Global_Imports';
const thing = h.thing_forHID('someHashID');
const ancestry = h.ancestry_forThing(thing);
```

**Graph Modes**: Tree (horizontal layout) or Radial (circular with rings)

**Bubble Integration**: Iframe embedding, postMessage communication, state publishing

### Key Features

**Visualization**: Radial graphs (resize, paging, rotate), tree graphs, cluster pagination, drag & drop, rubberband selection

**Data**: Full CRUD, relationship management, advanced search, bulk operations, per-item preferences

**UI/UX**: Details panel tabs, multiple themes, responsive, keyboard nav, mouse detection (autorepeat, double-click, long-click)

**Import/Export**: JSON, CSV, PDF export (HTML2Canvas + jsPDF)

### Architecture & Patterns

#### 1. State Management

A state class is a source of truth. It is often about what the user happens to be doing. We get excellent reactivity when the truth takes the form of svelte stores. HTML elements are individually kept up to date with respect to this truth, with insanely minimal code executed to do this.

- stores distributed across managers and state classes
- stores are all prefixed `w_`
- state classes persist across component recreation
- components reactive code is self-documenting

See [architecture/state.md](../architecture/state.md) for why we use state objects vs standard Svelte patterns.

#### 2. Manager Pattern

There are 16 singleton managers, each with a specific responsibility. For example,
- `Core` (`core`) - System state (w_t_startup, w_hierarchy)
- `Hierarchy` (`h`) - Tree data management
- `Geometry` (`g`) - Layout coordination
- `Hits` ( hits ) - Hit testing/hover
- `UX` (`x`) - User interaction state

#### 3. Persistable Pattern

Data models extend `Persistable`:
- `Thing` - Hierarchical nodes
- `Trait` - Properties
- `Predicate` - Relationships
- `Tag` - Categorization

Each has unique hash-based ID, implements `persistent_create_orUpdate()`, serializes via `fields` getter, supports all database backends.

#### 4. Database Abstraction

`Databases` class with pluggable implementations:
- `DB_Local` - IndexedDB (Dexie)
- `DB_Firebase` - Firestore
- `DB_Airtable` - Airtable API
- `DB_Bubble` - Plugin communication
- `DB_Test` - In-memory

#### 5. Component Organization

- **radial/** - Clusters, rings
- **tree/** - Branches, lines
- **widget/** - Drag, reveal, title
- **mouse/** - Clicks, buttons, sliders
- **controls/** - Breadcrumbs, preferences

#### 6. Hit Testing & Hover

RBush spatial indexing (O(log n) queries) for efficient hit detection.

- **Hits Manager** - Central hit testing with priority ordering: dots > widgets > rings > controls > rubberband
- **S_Hit_Target** - Base class for hit-testable elements
- **S_Element** - Visual properties (stroke, fill, cursor, border) react to `isHovering`

✅ **DO**: Use `Mouse_Responder` for clicks, register via `s_element.set_html_element()`, check `s_element.isHovering`
❌ **DON'T**: Modify `hits.w_s_hover` directly, mix with manual `on:mouseenter/leave`, forget `hits.delete_hit_target()`

See [architecture/hits.md](../architecture/hits.md) for complete click system (autorepeat, long-click, double-click), migration guide, testing.

#### 7. Geometry Layout

Computes positions/sizes for tree and radial modes.

**Flow**: Focus change → `g.layout()` → `G_TreeGraph.layout()` or `G_RadialGraph.layout()` → Each ancestry gets `G_Widget` → Computes origins, dot centers → Radial adds clusters, paging

**Key Classes**: `G_Widget`, `G_TreeGraph`, `G_RadialGraph`, `G_Cluster`, `G_TreeBranches`, `G_TreeLine`, `G_Paging`

See [analysis/layout-guide.md](layout.md) and [analysis/geometry.md](geometry.md).

## Development

### Setup

```bash
npm install          # Install dependencies
npm run dev          # Development server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production
npm run test         # Run tests
npm run test:ui      # UI tests
```

Tests in `src/lib/ts/tests/`, naming: `*.test.ts` or `*Test.ts`

#### URL Parameters

- `?db=local|firebase|airtable|bubble` - Database backend
- `?debug=bubble` - Enable Bubble debugging
- `?disable=auto_save,standalone_UI,details` - Disable features
- `?erase=settings` - Clear settings

#### Configuration Files

- `vite.config.js` - Dual build (plugin vs app)
- `svelte.config.js` - Preprocessing
- `tsconfig.json` - TypeScript strict mode
- `tailwind.config.ts` - Dark mode + Skeleton
- `netlify.toml` - Deployment
- `.prettierrc` - Formatting
- `typedoc.json` - API docs

#### Build & Deployment

**Vite builds**:
1. Default: Svelte app → `dist/` (sourcemaps enabled, minification disabled)
2. Plugin (`BUILD_TARGET=plugin`): Bubble.io → `dist/plugin/bubble-plugin.js` (ES module)

**Netlify**: Auto-deploys from main, Airtable headers configured, `netlify.toml`

#### Git Workflow

- Clear commit messages
- No force pushes to main
- Test before pushing
- Currently in a local github repo

### Code Style

**CRITICAL** - See [guides/style.md](../guides/style.md) for:
- Length-based ordering (imports, props, CSS, case statements)
- Tab-based alignment
- Svelte formatting
- All codebase conventions

TypeScript strict mode, Prettier formatting, `Global_Imports` for imports, descriptive function names.

#### Common Patterns

```typescript
// Imports
import { k, h, core, x, g, databases, T_Trait } from '../common/Global_Imports';

// Store subscription
$: hierarchy = $core.w_hierarchy;

// Persistable
class MyThing extends Persistable {
  async persistent_create_orUpdate(already_persisted: boolean) { }
  get fields(): Airtable.FieldSet { }
}
```

### Important Files

- `Core.ts` - System state (w_t_startup, w_hierarchy)
- `Hierarchy.ts` - Data hierarchy management
- `Geometry.ts` - Layout coordination
- `Hits.ts` - Hit testing/hover
- `UX.ts` - User interaction state
- `Constants.ts` - Application constants

### Debugging

**Two Principles** (see [guides/debugging.md](../guides/debugging.md)):
1. **Verify source first** - Check imports/destructuring before assuming usage issues
2. **Be systematic** - Form multiple hypotheses, test complete pipeline

**Enable logging**: Check `enable_logging` flags, Bubble plugin properties, `[PLUGIN]` console messages

**Common Issues**:
- State not updating → check `.set()` or `.update()`
- Database not persisting → verify `?db=` parameter
- Build errors → TypeScript strict mode compliance
- Geometry rendering → check SVG attributes/CSS before math

### Gotchas

- `/bubble/` is js (not ts), maintain Bubble compatibility
- Geometry: precise coordinates, don't round prematurely
- SVG-based rendering: understand viewBox and transforms
- State updates: assure appropriate Svelte reactivity
- Database ops: async, handle promises
- Hit testing: spatial indexing, register targets properly
- Widget layout differences: tree vs radial modes
- Focus widget (radial): no reveal dot
- Race conditions (see [guides/gotchas.md](../guides/gotchas.md))

## Notes

### DO / DON'T

✅ **DO**:
- Follow naming conventions (T_, w_, S_, G_)
- Use `Global_Imports`
- Write tests
- TypeScript strict mode
- Respect Persistable pattern
- Update stores when changing data
- Test multiple databases
- Read before modifying
- Understand geometry (Point, Size, Rect)

❌ **DON'T**:
- Modify naming prefixes
- Break singleton pattern
- Skip TypeScript types
- Modify `bubble/` without testing in Bubble.io
- Commit to main untested
- Change schemas without migration
- Add dependencies without review
- Disable strict checks
- Round geometry prematurely
- Use `any` types

### Additional Resources

**External**:
- Svelte: https://svelte.dev/docs
- TypeScript: https://www.typescriptlang.org/docs
- Vite: https://vitejs.dev/guide
- Bubble Plugin API: https://manual.bubble.io/core-resources/bubble-made-plugins
- RBush: https://github.com/mourner/rbush

**Internal Documentation**:

**Index**: [overview.md](notes/designs/documentation.md) - Complete index of all design documentation

**Architecture** (notes/designs/architecture/):
- [hits.md](notes/designs/architecture/hits.md) - Click/hover system, migration guide
- [state.md](notes/designs/architecture/state.md) - State objects vs Svelte patterns
- [writables.md](notes/designs/architecture/writables.md) - Store inventory by manager
- [buttons.md](notes/designs/architecture/buttons.md) - Button hierarchy, SVG icons
- [controls.md](notes/designs/architecture/controls.md) - Control components
- [preferences.md](notes/designs/architecture/preferences.md) - Settings management
- [styles.md](notes/designs/architecture/styles.md) - Styling system
- [ux.md](notes/designs/architecture/ux.md) - UX manager (focus, grabs, details)
- [database.md](notes/designs/architecture/database.md) - Database abstraction layer
- [bubble.md](notes/designs/architecture/bubble.md) - Bubble.io plugin integration
- [search.md](notes/designs/architecture/search.md) - Search functionality
- [paging.md](notes/designs/architecture/paging.md) - Radial paging system
- [components.md](notes/designs/architecture/components.md) - Components manager
- [details.md](notes/designs/architecture/details.md) - Details panel architecture

**Guides** (notes/designs/guides/):
- [style.md](notes/designs/guides/style.md) - **CRITICAL** - Complete codebase conventions
- [debugging.md](notes/designs/guides/debugging.md) - Systematic debugging methodology
- [gotchas.md](notes/designs/guides/gotchas.md) - Common pitfalls
- [refactoring.md](notes/designs/guides/refactoring.md) - Refactoring principles
- [markdown.md](notes/designs/guides/markdown.md) - Markdown formatting

---

**Last Updated**: 2025-12-26
