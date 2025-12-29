# Components Manager Architecture

S_Component objects hold state about user activity. Svelte sucks at this. The app needs to interact with the svelte components.

## Table of Contents
- [Overview](#overview)
- [Purpose](#purpose)
- [Data Structure](#data-structure)
- [Core Methods](#core-methods)
  - [Factory Pattern](#factory-pattern)
  - [Lookup](#lookup)
  - [Registration](#registration)
- [Dummy Component](#dummy-component)
- [S_Component](#s_component)
- [Component Types (T_Hit_Target)](#component-types-t_hit_target)
- [Usage Pattern](#usage-pattern)
- [Lifecycle](#lifecycle)
- [Comparison: S_Component vs S_Element](#comparison-s_component-vs-s_element)
- [Dictionary Structure Example](#dictionary-structure-example)
- [Performance](#performance)
- [Related Managers](#related-managers)
- [Best Practices](#best-practices)

## Overview

Components manager tracks and creates `S_Component` instances for complex interactive UI components. Provides factory pattern for creating unique S_Component per (ancestry, type) pair.

## Purpose

**State managed outside Svelte** - Components that need state persistence across recreation:
- Debug logging coordination
- Signal management
- Style construction by type and HID
- Unique ID assignment for DOM lookups

Unlike `S_Element` (for simple interactive elements like widgets), `S_Component` handles more complex interactive components with additional behavior.

## Data Structure

```typescript
class Components {
    private components_dict_byType_andHID: Dictionary<Dictionary<S_Component>> = {};
    //                                      type → (hid → S_Component)
}
```

Two-level dictionary:
1. **First level**: Indexed by `T_Hit_Target` type (component type)
2. **Second level**: Indexed by ancestry HID

This allows O(1) lookup: `components_dict[type][hid]`

## Core Methods

### Factory Pattern

```typescript
component_forAncestry_andType_createUnique(
    ancestry: Ancestry | null,
    type: T_Hit_Target
): S_Component | null {
    let s_component = this.component_forAncestry_andType(ancestry, type);
    if (!s_component) {
        s_component = new S_Component(ancestry, type);
        this.component_register(s_component);
    }
    return s_component;
}
```

**Create-if-not-exists**: Ensures only one S_Component per (ancestry, type) pair.

### Lookup

```typescript
component_forAncestry_andType(
    ancestry: Ancestry | null,
    type: T_Hit_Target
): S_Component | null {
    const dict = this.components_byHID_forType(type);
    return dict[ancestry?.hid ?? -1] ?? null;
}
```

Returns `null` if not found (doesn't create).

### Registration

```typescript
private component_register(s_component: S_Component) {
    const type = s_component.type;
    const hid = s_component.hid;
    if (!!hid && !!type) {
        const dict = this.components_byHID_forType(type);
        dict[hid] = s_component;
    }
}
```

Private - only called by factory method.

## Dummy Component

```typescript
get dummy(): S_Component {
    if (!this._dummy) {
        this._dummy = new S_Component(null, T_Hit_Target.none);
    }
    return this._dummy;
}
```

Singleton dummy for default/fallback cases. Not registered in dictionary.

## S_Component

Extends `S_Hit_Target` for hit testing:

```typescript
class S_Component extends S_Hit_Target {
    ancestry: Ancestry | null;
    type: T_Hit_Target;

    constructor(ancestry: Ancestry | null, type: T_Hit_Target) {
        super();
        this.ancestry = ancestry;
        this.type = type;
    }

    get hid(): Integer {
        return this.ancestry?.hid ?? -1;
    }
}
```

## Component Types (T_Hit_Target)

Examples from codebase:
- `T_Hit_Target.cluster_pager` - Radial cluster paging UI
- `T_Hit_Target.breadcrumbs` - Navigation breadcrumbs
- `T_Hit_Target.ring` - Radial ring interaction
- `T_Hit_Target.rubberband` - Selection rubberband
- (many others - see Enumerations.ts)

## Usage Pattern

```typescript
import { components } from '../managers/Components';

// Get or create component
const s_component = components.component_forAncestry_andType_createUnique(
    ancestry,
    T_Hit_Target.cluster_pager
);

// Use component
s_component.set_html_element(element);  // Register for hit testing
s_component.isHovering;                 // Check hover state
```

## Lifecycle

1. **Creation**: Component created on first use
2. **Registration**: Automatically registered in dictionary
3. **Persistence**: Lives until page reload (not tied to Svelte component lifecycle)
4. **Reuse**: Same S_Component reused when Svelte component recreates

## Comparison: S_Component vs S_Element

| Aspect | S_Component | S_Element |
|--------|-------------|-----------|
| Manager | Components | Elements |
| Base class | S_Hit_Target | S_Hit_Target |
| Purpose | Complex components | Simple interactive elements |
| Examples | Pagers, breadcrumbs, rings | Widgets, dots, lines |
| Factory | `component_forAncestry_andType_createUnique` | `s_element_for` |
| Storage | `components_dict_byType_andHID` | Elements manager dict |

Both extend S_Hit_Target for unified hit testing via Hits manager.

## Dictionary Structure Example

```typescript
components_dict_byType_andHID = {
    'cluster_pager': {
        '123': S_Component(ancestry_123, cluster_pager),
        '456': S_Component(ancestry_456, cluster_pager)
    },
    'breadcrumbs': {
        '789': S_Component(ancestry_789, breadcrumbs)
    }
}
```

## Performance

- **O(1) lookup**: Two-level dictionary with direct indexing
- **Lazy creation**: Only created when needed
- **No cleanup**: Components persist (small memory footprint)
- **Shared instances**: Multiple Svelte components can share same S_Component

## Related Managers

- **Elements**: Similar factory for S_Element instances
- **Hits**: Uses S_Component for hit testing
- **Radial**: Creates cluster pager components
- **Controls**: Creates breadcrumb components

## Best Practices

✅ **DO**:
- Use `createUnique` for factory pattern
- Register with hit testing if interactive
- One S_Component per (ancestry, type) pair

❌ **DON'T**:
- Create S_Component directly (use factory)
- Register manually (factory handles it)
- Assume component exists (check for null)
- Mix S_Component and S_Element use cases
