# Writable Stores Architecture

## Overview

Svelte writable and derived stores for reactive state management. All stores are organized in manager classes that own stores for their domain.

## Manager Pattern

Each manager is a singleton class that owns stores for its domain. Managers follow a common pattern: stores are accessed through the manager instance.

**Structure**: Stores as class properties or module exports, `w_` prefix, singleton instance exported

**TypeScript usage**:
```typescript
// Manager instance
import { x } from '../managers/UX';
const focus = get(x.w_ancestry_focus);
```

**Svelte usage**:
```typescript
// Manager instance - destructure for reactivity
import { x } from '../../ts/managers/UX';
const { w_ancestry_focus } = x;
$w_ancestry_focus  // Reactive access
```

**Note**: Some managers (like `Colors.ts`) also provide utility functions alongside their stores. This doesn't change the pattern—they're still managers that own stores for their domain.

## Store Types

### Writable Stores

**Use for**: Manually set values (user input, preferences, counters, UI state)

**Characteristics**: Read-write (`.set()`, `.update()`), source of truth or manually controlled

**Examples**: `w_items` (source array), `w_index` (selection), `w_count_rebuild` (counter), `w_thing_fontFamily` (preference)

### Derived Stores

**Use for**: Computed values from other stores

**Characteristics**: Read-only (`Readable<T>`), auto-updates, no manual sync, type-safe

**Pattern**:
```typescript
w_item!: Readable<T | null>;
constructor() {
    this.w_item = derived([this.w_items, this.w_index], 
        ([items, index]) => items[index] ?? null);
}
```

**Current derived stores**:
- **S_Items.ts**: `w_item`, `w_length`, `w_extra_titles`, `w_description`
- **UX.ts**: `w_ancestry_focus`, `w_ancestry_forDetails`

**Chaining**: Stores can depend on derived stores (e.g., `w_items` → `w_length` → `w_extra_titles`)

## Patterns

**Increment pattern**: Increment to trigger reactivity without passing data
```typescript
w_count_rebuild.update(n => n + 1);
```

**Naming**: `w_` (writable), `w_count_` (counter), `w_s_` (state object), `w_t_` (type/enum), `w_show_` (visibility)

## Best Practices

- **Writable**: user preferences, edit state, counters, UI state, system state
- **Derived**: computed values from other stores
- **Initialize derived stores** in constructor/setup() before setting sources
- **All stores strongly typed** with TypeScript

## Store Organization

Complete inventory of all stores by manager:

| File                 | Store                        |                                              |
| -------------------- | ---------------------------- | -------------------------------------------- |
| **UX.ts**            | <div align="center">7</div>  | Properties that track **user's interaction** |
|                      | `w_s_title_edit`             | editing                                      |
|                      | `w_s_alteration`             | adding relationships (eg, related)           |
|                      | `w_thing_title`              | editing                                      |
|                      | `w_relationship_order`       | relocating among siblings                    |
|                      | `w_thing_fontFamily`         | rendering                                    |
|                      | `w_ancestry_forDetails`      | details of one among multiple selection      |
|                      | `w_ancestry_focus`           | main feature of webseriously -> focus        |
| **Colors.ts**        | <div align="center">3</div>  | **Color** preferences and utilities          |
|                      | `w_background_color`         | user's choice of "mood"                      |
|                      | `w_thing_color`              | editing                                      |
|                      | `w_separator_color`          | related to background, darker                |
| **Visibility.ts**    | <div align="center">14</div> | **UI visibility** (booleans and types)       |
|                      | `w_t_cluster_pager`          | stepper or slider                            |
|                      | `w_t_breadcrumbs`            | hierarchy or navigation                      |
|                      | `w_t_auto_adjust_graph`      |                                              |
|                      | `w_t_directionals`           | browsing build notes                         |
|                      | `w_t_graph`                  | radial or tree                               |
|                      | `w_t_details`                | hide and show various details                |
|                      | `w_t_trees`                  | whether or not to show related               |
|                      | `w_t_countDots`              | parents, children, related                   |
|                      | `w_id_popupView`             | just build notes for now                     |
|                      | `w_show_save_data_button`    | debugging                                    |
|                      | `w_show_search_controls`     | ???                                          |
|                      | `w_show_related`             | ???                                          |
|                      | `w_show_details`             | and hide                                     |
|                      | `w_show_countsAs_dots`       | dots or numbers                              |
|                      | `w_show_other_databases`     | data details "option to show more"           |
| **Search.ts**        | <div align="center">4</div>  | **Search state**                             |
|                      | `w_search_results_found`     |                                              |
|                      | `w_search_results_changed`   | re-render results list                       |
|                      | `w_s_search`                 | control UX                                   |
|                      | `w_search_preferences`       | ???                                          |
| **Events.ts**        | <div align="center">10</div> | **mostly mouse related**                     |
|                      | `w_count_details`            |                                              |
|                      | `w_count_rebuild`            |                                              |
|                      | `w_count_window_resized`     |                                              |
|                      | `w_count_mouse_down`         |                                              |
|                      | `w_count_mouse_up`           |                                              |
|                      | `w_control_key_down`         |                                              |
|                      | `w_mouse_button_down`        |                                              |
|                      | `w_scaled_movement`          |                                              |
|                      | `w_mouse_location`           |                                              |
|                      | `w_mouse_location_scaled`    |                                              |
| **Geometry.ts**      | <div align="center">6</div>  | Properties that influence **Layout**         |
|                      | `w_depth_limit`              |                                              |
|                      | `w_branches_areChildren`     |                                              |
|                      | `w_user_graph_center`        |                                              |
|                      | `w_user_graph_offset`        |                                              |
|                      | `w_rect_ofGraphView`         |                                              |
|                      | `w_scale_factor`             |                                              |
| **Radial.ts**        | <div align="center">4</div>  | Managing **Radial** mode                     |
|                      | `w_rotate_angle`             | radial UX                                    |
|                      | `w_resize_radius`            | ""                                           |
|                      | `w_g_paging`                 | layout                                       |
|                      | `w_g_cluster`                | layout                                       |
| **Core.ts**          | <div align="center">2</div>  | **System** state                             |
|                      | `w_t_startup`                | assurance of everything ready for UI         |
|                      | `w_hierarchy`                | single source of truth for all data          |
| **Databases.ts**     | <div align="center">2</div>  | **Database** state                           |
|                      | `w_data_updated`             |                                              |
|                      | `w_t_database`               |                                              |
| **Hits.ts**          | <div align="center">4</div>  | Tracking and responding to **mouse**         |
|                      | `w_s_hover`                  | UX element currently under mouse             |
|                      | `w_longClick`                |                                              |
|                      | `w_autorepeat`               |                                              |
|                      | `w_dragging`                 |                                              |
| **Configuration.ts** | <div align="center">1</div>  | Platform and App **configuration**           |
|                      | `w_device_isMobile`          |                                              |

