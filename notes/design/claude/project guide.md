# Webseriously Project Guide

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
│   │   ├── main/       # Core app components (SeriouslyApp, Panel)
│   │   ├── mouse/      # Mouse interaction components
│   │   ├── radial/     # Radial graph visualization
│   │   ├── search/     # Search UI components
│   │   ├── text/       # Text editing and display
│   │   ├── tree/       # Tree graph visualization
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

Singleton managers handle specific domains (in `src/lib/ts/managers/`):
- `Hierarchy` (`h`): Tree data management
- `Colors`: Color scheme management
- `Components`: Component registry
- `Configuration` (`c`): App configuration
- `Controls`: Graph mode and UI controls
- `Details`: Details panel state
- `Elements`: S_Element and S_Mouse factory
- `Features`: Feature flags
- `Geometry` (`g`): Layout coordination and graph view state
- `Hits`: RBush-based hit testing and hover detection
- `Preferences` (`p`): User settings persistence
- `Radial`: Radial graph specific state
- `Search`: Search functionality
- `Stores`: Central store management
- `Visibility` (`show`): UI visibility state

Managers are imported from `Global_Imports` and used as single-letter aliases where common.

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

Svelte components organized by function:
- **radial/**: Radial graph visualization (clusters, rings)
- **tree/**: Tree graph visualization (branches, lines)
- **widget/**: Drag, reveal, title editing
- **mouse/**: Click handling, buttons, sliders
- **controls/**: Breadcrumbs, preferences panels
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

### 7. Hit Testing & Hover System

The hover system uses RBush spatial indexing for efficient hit detection across all interactive elements.

**Architecture**:
- **Hits Manager**: `src/lib/ts/managers/Hits.ts` - Central hit testing with RBush R-tree indexing
- **S_Hit_Target**: Base class for all hit-testable elements (state/S_Hit_Target.ts)
- **S_Element**: Extends S_Hit_Target, computes visual properties (stroke, fill, cursor, border)
- **Mouse_Responder**: Handles click events (down/up/double/long) but NOT hover detection

**Class Hierarchy**:
```
S_Hit_Target (base)
├── S_Element (visual properties)
│   └── S_Widget (widget-specific state)
├── S_Component (complex interactive components)
├── S_Rotation (ring rotation interaction)
└── S_Resizing (ring resize interaction)
```

**Key Files**:
- `src/lib/ts/managers/Hits.ts` - RBush indexing, hover detection, hit queries
- `src/lib/ts/state/S_Hit_Target.ts` - Base class with rect, cursor, color properties
- `src/lib/ts/state/S_Element.ts` - Visual property computation (stroke, fill, border)
- `src/lib/ts/state/S_Mouse.ts` - Mouse event encapsulation for click handling
- `src/lib/svelte/mouse/Mouse_Responder.svelte` - Click event handler component

**How It Works**:
1. Global mouse position tracked in `g.w_mouse_location`
2. `Hits.handle_mouse_movement_at(point)` called on mouse move (20ms throttle)
3. RBush spatial query finds all targets at mouse position
4. Priority ordering: dots > widgets > rings > other
5. `hits.w_s_hover` store updated with top-priority target
6. S_Element getters (`stroke`, `fill`, `cursor`, `border`) react to `isHovering`

**RBush Integration**:
- Each S_Hit_Target registers its bounding rect via `set_html_element()`
- Rects stored in RBush R-tree for O(log n) spatial queries
- `contains_point` closure on S_Hit_Target refines hit testing for non-rectangular shapes
- Automatic cleanup on component destroy via `hits.delete_hit_target()`

**Visual Property Logic** (S_Element):
- `isInverted`: Base flag for inverting hover appearance
- `color_isInverted`: `isInverted XOR isHovering` - determines actual color state
- `fill`: Returns hover color, selection color, or background based on state
- `stroke`: Returns background or element color based on inversion
- `border`: Shows based on editing, focus, grabbed, or hover state

**Widget-Specific Behavior**:

Widgets (src/lib/svelte/widget/) have special hover rules:
- **Widget dots** (drag/reveal): Use inverted colors when grabbed/editing
- **Drag dots**: Set `isInverted` based on alteration permissions
- **Borders**: Show on hover, focus, grabbed, or editing states

**Best Practices**:

✅ **DO**:
- Use `Mouse_Responder` for click events (down/up/double/long)
- Register hit targets via `s_element.set_html_element(element)`
- Check `s_element.isHovering` getter for hover state
- Provide `contains_point` closure for non-rectangular hit areas
- Let `S_Element` compute visual properties

❌ **DON'T**:
- Modify `hits.w_s_hover` directly - use `S_Hit_Target.isHovering` setter
- Mix hit testing with manual `on:mouseenter/leave` handlers
- Forget to call `hits.delete_hit_target()` on component destroy

**Debugging**:
```typescript
// Check current hover state
console.log('Hover:', get(hits.w_s_hover)?.id);

// Log all registered targets
debug.log_hits(hits.info);

// Check specific target
console.log('Target rect:', s_element.rect?.description);
```

### 8. Geometry Layout System

The geometry system computes positions and sizes for all graph elements in both tree and radial modes.

**Key Files** (in `src/lib/ts/geometry/`):

| File | Purpose |
|------|---------|
| `G_Widget.ts` | Single source of truth for widget positions, dot locations, title origin |
| `G_RadialGraph.ts` | Radial/necklace mode layout with clusters around focus |
| `G_TreeGraph.ts` | Tree mode layout with horizontal branches |
| `G_Cluster.ts` | Widget cluster layout in radial mode (arc angles, fork direction) |
| `G_TreeBranches.ts` | Recursive subtree branch positioning |
| `G_TreeLine.ts` | Connecting lines between parent/child widgets |
| `G_Cluster_Pager.ts` | Paging arc geometry for large clusters |
| `G_Pages.ts` | Page state management per Thing |
| `G_Paging.ts` | Paging calculations per predicate direction |

**Layout Flow**:
1. Focus ancestry change triggers `g.layout()` in Geometry manager
2. Mode-specific layout called: `G_TreeGraph.layout()` or `G_RadialGraph.layout()`
3. Each ancestry gets a `G_Widget` instance via `ancestry.g_widget`
4. G_Widget computes: `origin_ofWidget`, `origin_ofTitle`, `center_ofDrag`, `center_ofReveal`
5. Radial mode additionally computes: cluster angles, necklace positions, paging arcs

**G_Widget Key Properties**:
```typescript
origin_ofWidget     // Top-left of widget bounding box
origin_ofTitle      // Position for title text
center_ofDrag       // Center of drag dot
center_ofReveal     // Center of reveal dot
location_ofRadial   // Position on radial necklace
size_ofSubtree      // Height for tree layout calculations
reveal_dot_isAt_right // Orientation flag (true = children on right)
pointsTo_child      // Direction flag for line drawing
```

**Tree Mode Layout**:
- Widgets arranged in horizontal tree from focus
- `G_TreeBranches` recursively positions child subtrees
- `size_ofSubtree` computed bottom-up for vertical centering
- `G_TreeLine` draws connecting lines between widgets

**Radial Mode Layout**:
- Focus widget centered, children/parents on ring "necklace"
- `G_Cluster` groups widgets by predicate (contains, related, etc.)
- Widgets distributed around cluster's fork angle
- `G_Cluster_Pager` provides arc UI for paging through large clusters

**Radial Focus Widget Layout**:

The focus widget in radial mode is positioned at the center of the graph view, computed in `G_RadialGraph.layout_focus()`:

1. **Get focus ancestry**: `s.w_ancestry_focus` provides the current focus
2. **Get G_Widget**: `ancestry.g_widget` (the geometry object for the focus)
3. **Compute center offset**: Title is horizontally centered via `x = -7.5 - (width_ofTitle / 2)`
4. **Compute origin**: `g.center_ofGraphView.offsetByXY(x, -11)` places widget at graph center
5. **Call `g_focus.layout()`**: Computes dot positions and title origin relative to widget
6. **Set layout properties**:
   - `width_ofWidget`: Set to title width (no reveal dot for focus)
   - `location_ofRadial`: The computed center position
   - `width_ofGraphDrawing`: Title width + 30 (for printing margin)
   - `origin_ofRadial`: Adjusted for `reveal_dot_isAt_right` flag

The focus widget differs from necklace widgets because:
- It has no reveal dot (focus is already revealed)
- Its position is absolute (center of graph) rather than relative to ring
- `layout_focus()` overrides any values set by `layout()`

**Orientation Flags** (necklace widgets only):
- `reveal_dot_isAt_right`: Drag dot on left, reveal dot on right. False for widgets on the left side of the radial ring.
- `pointsTo_child`: Default true for children of focus. False for parents of focus (line connects toward focus).

**Integration with Svelte Components**:
```svelte
<!-- Widget.svelte uses G_Widget for positioning -->
<script>
  $: g_widget = ancestry.g_widget;
  $: origin = g_widget.origin_ofWidget;
</script>
<div style="left: {origin.x}px; top: {origin.y}px">
```


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

Tests located in `src/lib/ts/tests/`

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

**Last Updated**: 2025-12-12
**Maintained by**: AI assistants should keep this file current as architecture evolves
