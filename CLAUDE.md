# CLAUDE.md - Webseriously Project Guide

This document provides comprehensive guidance for AI assistants working on the Webseriously project.

## Project Overview

**Webseriously** is a sophisticated Svelte-based visualization and data management application with hierarchical graph displays, interactive UI components, and multi-database support. The project can be embedded as a Bubble.io plugin or run standalone.

- **Package Name**: `webseriously`
- **Repository**: `gizmolab10/seriously-svelte`
- **Framework**: Svelte 4 + Vite
- **Language**: TypeScript
- **Deployment**: Netlify (https://webseriously.netlify.app)

## Naming Conventions

**Critical**: Follow these strict naming conventions throughout the codebase:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `T_` | Types/Enums | `T_Trait`, `T_Startup`, `T_Persistable` |
| `w_` | Svelte Stores (writable) | `w_hierarchy`, `w_ancestry_focus` |
| `S_` | State Classes | `S_Alteration`, `S_Widget`, `S_Element` |
| `G_` | Geometry | `G_Point`, `G_Rectangle` |
| `k` | Constants | `k.empty`, `k.hashLength` |
| `h` | Hierarchy manager instance | `h.thing_forHID()` |
| `s` | Global state instance | `s.w_thing_title` |

**Variable naming**: Use clear, descriptive names
- Boolean flags: `is_`, `has_`, `should_`
- IDs: End with `ID` or `_id`
- Counts: Start with `count_`

## Directory Structure

```
src/
├── assets/              # Static assets (images, icons)
├── lib/
│   ├── js/             # Legacy JavaScript (being migrated to TypeScript)
│   ├── svelte/         # Svelte components organized by function
│   │   ├── controls/   # UI controls (sliders, buttons, inputs)
│   │   ├── details/    # Detail panels and info displays
│   │   ├── draw/       # Drawing/canvas components
│   │   ├── experimental/ # Experimental/WIP components
│   │   ├── graph/      # Graph visualization components
│   │   ├── main/       # Core app components (SeriouslyApp, Panel)
│   │   ├── mouse/      # Mouse interaction components
│   │   ├── search/     # Search UI components
│   │   ├── text/       # Text editing and display
│   │   └── widget/     # Widget system components
│   └── ts/             # TypeScript core logic
│       ├── common/     # Shared utilities, constants, extensions
│       ├── database/   # Database abstraction layer
│       ├── debug/      # Debugging utilities
│       ├── files/      # File I/O operations
│       ├── layout/     # Layout algorithms
│       ├── managers/   # Singleton manager classes
│       ├── persistable/ # Data model classes
│       ├── runtime/    # Runtime data structures (Ancestry, etc.)
│       ├── signals/    # Event system
│       ├── state/      # State management
│       ├── tests/      # Jest tests
│       ├── types/      # Type definitions and geometry
│       ├── utilities/  # Helper functions
│       └── ux/         # UX state and controls
├── styles/             # Global CSS/SCSS
└── main.js            # Entry point

bubble/                 # Bubble.io plugin integration
notes/                  # Design docs and experiments
public/                 # Static public assets
```

## Architecture & Patterns

### 1. State Management

**Global State Pattern**:
- Single `State` class instance (`s`) in `src/lib/ts/state/State.ts`
- All state is Svelte writable stores prefixed with `w_`
- Components subscribe to stores reactively

```typescript
// Example: Accessing global state
import { s } from '$lib/ts/state/State';

$: title = $s.w_thing_title;  // Reactive subscription
s.w_thing_title.set('New Title');  // Update
```

**State Classes**:
- `S_` prefixed classes represent complex state objects
- Examples: `S_Widget`, `S_Element`, `S_Alteration`
- These are stored in writable stores

### 2. Manager Pattern

Singleton managers handle specific domains:
- `Hierarchy`: Tree data management
- `Components`: Component registry
- `Colors`: Color scheme management
- `Preferences`: User settings
- `Configuration`: App configuration
- `Visibility`: UI visibility state

Managers are imported from `Global_Imports` and used as `h` (Hierarchy), etc.

### 3. Persistable Pattern

Data models extend `Persistable` base class:
- `Thing`: Core hierarchical nodes
- `Trait`: Properties attached to Things
- `Predicate`: Relationships between Things
- `Tag`: Categorization
- `User`: User data

Each persistable:
- Has unique ID (hash-based)
- Implements `persistent_create_orUpdate()`
- Serializes to database-specific format via `fields` getter
- Supports multiple database backends

### 4. Database Abstraction

Multi-database support via `Databases` class:
- `DB_Local`: IndexedDB (Dexie) for local storage
- `DB_Firebase`: Firebase Firestore
- `DB_Airtable`: Airtable API
- `DB_Bubble`: Bubble.io plugin communication
- `DB_Test`: In-memory for testing

Switch databases via URL parameter: `?db=bubble` or `?db=local`

### 5. Component Organization

**73 Svelte components** organized by function:
- **graph/**: Radial and tree graph visualizations
- **widget/**: Drag, reveal, title editing
- **controls/**: Interactive UI elements
- **experimental/**: Work-in-progress features

**Component Best Practices**:
- Import state from `Global_Imports`
- Use reactive statements (`$:`) for computed values
- Keep components focused and single-purpose
- Emit events for parent communication

### 6. Event System

Signal-based events in `src/lib/ts/signals/`:
- `Signals`: Typed event emitter
- `Events`: Event definitions
- Components and managers communicate via signals

## Key Systems

### Hierarchy System

The core data structure is a hierarchical graph:
- **Thing**: Nodes in the hierarchy
- **Ancestry**: Runtime tree path from root to node
- **Hierarchy Manager**: Manages tree operations

```typescript
import { h } from '$lib/ts/common/Global_Imports';

const thing = h.thing_forHID('someHashID');
const ancestry = h.ancestry_forThing(thing);
```

### Graph Visualization

Two primary modes:
1. **Tree Graph**: Horizontal tree layout
2. **Radial Graph**: Circular/radial layout with rings

State tracked via `w_auto_adjust_graph` and various graph-specific stores.

### Bubble Plugin Integration

`bubble/` directory contains Bubble.io plugin code:
- Embeds Webseriously in iframe
- Two-way postMessage communication
- Publishes state changes: `focus_id`, `selected_ids`, `in_radial_mode`
- Receives commands: `change_selection`, `change_focus`, `replace_hierarchy`

## Development Workflow

### Setup

```bash
# Install dependencies
npm install  # or yarn

# Development server
npm run dev  # Runs on localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

**Jest + ts-jest** setup for TypeScript testing:

```bash
npm run test
```

Tests located in `src/lib/ts/tests/`:
- `slim/`: New streamlined test suite
  - `core/`: Core functionality tests
  - `integration/`: Integration tests
  - `e2e/`: End-to-end tests
  - `migration/`: Migration phase tests
- Legacy tests at root level

**Test naming**: `*.test.ts` or `*Test.ts`

### URL Parameters

Control app behavior via URL params:
- `?db=local|firebase|airtable|bubble`: Database backend
- `?debug=bubble`: Enable Bubble plugin debugging
- `?disable=auto_save,standalone_UI,details`: Disable features
- `?erase=settings`: Clear user settings

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (`.prettierrc`)
- **Imports**: Absolute paths via `Global_Imports`
- **Comments**: Explain "why", not "what"
- **Function names**: Descriptive, verb-based

## Build & Deployment

### Vite Configuration

Two build modes in `vite.config.js`:

1. **Default**: Svelte app build
   - Output: `dist/`
   - Sourcemaps enabled
   - Minification disabled for debugging

2. **Plugin Build**: `BUILD_TARGET=plugin`
   - Entry: `bubble/initialize.js`
   - Output: `dist/plugin/bubble-plugin.js`
   - ES module format for Bubble.io

### Netlify Deployment

- Configured via `netlify.toml`
- Headers allow Airtable API connections
- Auto-deploys from main branch
- URL: https://webseriously.netlify.app

## Special Directories

### `bubble/`
Bubble.io plugin JavaScript files. These are **not** TypeScript and should maintain compatibility with Bubble's plugin system.

**Key files**:
- `initialize.js`: Plugin setup, iframe creation, message handling
- `update.js`: Handle property updates from Bubble
- `change_*.js`: Command handlers

### `notes/`
Internal documentation and experiments:
- `design/`: Design documents
- `experiments/`: Experimental code
- `tools/`: Development tools

**Not for production code**.

### `.obsidian/`
Obsidian markdown editor configuration. Used for documentation. Can be ignored.

## Important Notes for AI Assistants

### DO:
- ✅ Follow naming conventions strictly (T_, w_, S_, G_)
- ✅ Use `Global_Imports` for common imports
- ✅ Keep components in appropriate `svelte/` subdirectories
- ✅ Write tests for new functionality
- ✅ Use TypeScript for all new code
- ✅ Respect the Persistable pattern for data models
- ✅ Update relevant state stores when changing data
- ✅ Test with different database backends
- ✅ Check console for logged errors (extensive debug logging)

### DON'T:
- ❌ Modify naming convention prefixes
- ❌ Break the singleton manager pattern
- ❌ Skip TypeScript types (strict mode required)
- ❌ Modify `bubble/` files without testing in Bubble.io
- ❌ Commit to main without testing
- ❌ Change database schemas without migration plan
- ❌ Add dependencies without review (large bundle size concern)
- ❌ Disable TypeScript strict checks

### Common Patterns to Recognize

**Import pattern**:
```typescript
import { k, h, s, databases, T_Trait } from '../common/Global_Imports';
```

**Store subscription pattern**:
```svelte
<script>
import { s } from '$lib/ts/state/State';
let title;
$: title = $s.w_thing_title;  // Reactive
</script>
```

**Persistable pattern**:
```typescript
class MyThing extends Persistable {
  async persistent_create_orUpdate(already_persisted: boolean) {
    // Database operation
  }
  get fields(): Airtable.FieldSet {
    // Serialize for database
  }
}
```

## Debugging

### Enable Logging
- Check `enable_logging` flags in various modules
- Bubble plugin: Set `enable_logging: true` in properties
- Look for `[PLUGIN]` prefixed console messages

### Common Issues

**State not updating**: Check if store is being set correctly with `.set()` or `.update()`

**Database not persisting**: Verify `db` URL parameter matches intended backend

**Bubble plugin not communicating**: Check browser console for CORS or iframe errors

**Build errors**: Check TypeScript strict mode compliance

## File Patterns

**Find files by type**:
```bash
# All Svelte components
find src/lib/svelte -name "*.svelte"

# TypeScript types
find src/lib/ts/types -name "*.ts"

# Tests
find src/lib/ts/tests -name "*.test.ts"
```

## Git Workflow

- Feature branches: `claude/*` for AI-generated changes
- Commit messages: Clear, descriptive
- No force pushes to main
- Test before pushing

## Additional Resources

- **Svelte Docs**: https://svelte.dev/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev/guide
- **Bubble Plugin API**: https://manual.bubble.io/core-resources/bubble-made-plugins

---

**Last Updated**: 2025-11-14
**Maintained by**: AI assistants should keep this file current as architecture evolves
