# Project Analysis & Development Log

## Goals

- Analyze and refactor state management in seriously-svelte
- Document code structure and patterns
- Track improvements and changes

## Strategy

### Current Focus
- Understanding the state management architecture
- Analyzing State.ts and related files
- Identifying patterns and potential improvements

## Tasks

- [x] Analyze `src/lib/ts/state/State.ts`
- [ ] TBD: Further analysis based on findings

## Analyses

### State.ts Analysis (2025-11-09)

**File:** `src/lib/ts/state/State.ts`

**Purpose:** Centralized state management module for Svelte application

#### Structure
- Uses unique symbols as visual dividers to organize stores into categories
- Naming convention: `w_` prefix for writable stores
- All stores are strongly typed with TypeScript

#### Store Categories

**1. Thing-Related Stores (lines 11-15)**
- `w_relationship_order`: Track relationship ordering
- `w_thing_fontFamily`: Font family for things
- `w_thing_title`: Current thing title (nullable)
- `w_s_alteration`: Alteration state object (nullable)
- `w_s_title_edit`: Title editing state (nullable, defaults to null)

**2. Ancestry/Hierarchy Stores (lines 19-21)**
- `w_hierarchy`: Main hierarchy manager instance
- `w_ancestry_focus`: Currently focused ancestry
- `w_ancestry_forDetails`: Ancestry for detail display

**3. Counter Stores (lines 25-28)**
- `w_count_window_resized`: Tracks window resize events
- `w_count_mouse_up`: Tracks mouse up events
- `w_count_rebuild`: Tracks rebuild operations
- `w_count_details`: Tracks detail view changes

**4. Miscellaneous Stores (lines 32-39)**
- `w_t_startup`: Application startup state
- `w_auto_adjust_graph`: Auto-adjustment settings
- `w_s_hover`: Currently hovered element
- `w_popupView_id`: Active popup view ID
- `w_dragging_active`: Dragging state
- `w_control_key_down`: Control key state
- `w_device_isMobile`: Mobile device detection
- `w_font_size`: Font size setting

#### Strengths
- Clear organization using symbol separators
- Consistent naming convention
- Strong typing throughout
- Appropriate use of nullable types

#### Potential Issues
1. **Missing initial values**: Most stores lack default values
2. **Global state**: All stores are module-level globals (may complicate testing)
3. **No derived stores**: No computed/derived stores present
4. **Symbol values unused**: Symbols serve only as visual markers

#### Usage Pattern
Global state registry where components import individual stores as needed. Counter-based stores use increment pattern to trigger reactive updates.

---

## Notes

- Project recently renamed "Stores" to "State" (commit: 4a12198)
- Recent refactoring includes radial view stores, color stores, database writable stores, and search stores
