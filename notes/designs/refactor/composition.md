# Component Composition in Svelte

Props-down, events-up. Slots for flexible content. Compound components for complex UIs. i wanted to document the pattern and see where we could use it better.

## Table of Contents
- [Svelte Composition Patterns](#svelte-composition-patterns)
  - [Key Principles](#key-principles)
  - [Props Best Practices](#props-best-practices)
  - [Composition Strategies](#composition-strategies)
- [Component Audit Checklist](#component-audit-checklist)

## Svelte Composition Patterns

### Key Principles

Based on Svelte best practices:

1. **Props down, events up**: Parent components pass data via props, children emit events to communicate back
2. **Component composition over prop soup**: Break complex components into smaller composable pieces instead of adding endless props
3. **Slots for flexibility**: Use slots when you need the consumer to control markup/layout
4. **$state() for internal, $props() for external**: Component owns its own state, receives props from parent
5. **Default values in destructuring**: `let { name = "default" } = $props()` provides fallbacks

### Props Best Practices

**Use $props() rune (Svelte 5):**
```typescript
let { title, count = 0, onClick } = $props();
```

**Type your props:**
```typescript
let { title, count = 0 }: { title: string; count?: number } = $props();
```

**Avoid prop mutation** unless using `$bindable()`:
```typescript
let { value = $bindable(0) } = $props();  // Two-way binding
```

### Composition Strategies

**Bad - Prop soup:**
```svelte
<Card 
  title="..."
  subtitle="..."
  body="..."
  imageUrl="..."
  badgeText="..."
  buttonLabel="..."
  onButtonClick={...} />
```

**Good - Compound components:**
```svelte
<Card>
  <CardHeader title="..." subtitle="..." />
  <CardImage src="..." />
  <CardBody>{content}</CardBody>
  <CardFooter>
    <Button>Click me</Button>
  </CardFooter>
</Card>
```

**When to refactor**: If a component has 3-4+ props for layout/content, consider breaking into compound components.

## Component Audit Checklist

Components that could benefit from better composition:

### High Priority - Prop Soup

- [ ] **Primary_Controls.svelte** - Manages ~10 different controls inline; could break into `<Controls.Details />`, `<Controls.Recents />`, `<Controls.Search />` compound pattern
- [ ] **D_Selection.svelte** - Multiple tables (characteristics, relationships, properties); could use `<SelectionTable.Characteristics />` sub-components
- [ ] **Radial_Cluster.svelte** - Handles widgets, paging UI, rotation, all in one file; break into `<Cluster.Widgets />`, `<Cluster.Pager />`, `<Cluster.RotationHandle />`

### Medium Priority - Mode Switching

- [ ] **Breadcrumbs.svelte** - Mode selection embedded (ancestry vs recents); parent should choose mode and pass data
- [ ] **Search_Results.svelte** - Likely mixes result rendering with search state; extract `<SearchResultItem />` component
- [ ] **Widget.svelte** - Handles title, drag, reveal, all together; could compose `<Widget.Title />`, `<Widget.DragHandle />`, `<Widget.RevealToggle />`

### Low Priority - Already Good Composition

- [ ] **Breadcrumb_Button.svelte** - Good! Single responsibility, clear props, used compositionally by parent
- [ ] **Button.svelte** - Good! Reusable, clear interface, used throughout app
- [ ] **Glow_Button.svelte** - Good! Specialized variant with focused purpose

### Slot Opportunities

- [ ] **Banner_Hideable.svelte** - Wraps content; perfect candidate for `<slot />` to let parent control banner content
- [ ] **Card components** (if any exist) - Classic slot use case for header/body/footer
- [ ] **Modal/Dialog** (if exists) - Header, body, footer slots

### Parent-Child Communication

- [ ] **Next_Previous.svelte** - Review event emission pattern; ensure using Svelte 5 event syntax
- [ ] **Segmented.svelte** - Check if using `$bindable()` for two-way binding where appropriate
- [ ] **Triangle_Button.svelte** - Verify props-down, events-up pattern

## Summary

**Key takeaways:**

1. We're already doing composition fairly well (Breadcrumb_Button, Button usage)
2. Biggest wins: break up large components (Primary_Controls, Radial_Cluster)
3. Use slots more for customization (Banner_Hideable, separator overrides)
4. Move mode/data selection to parents; children should receive data via props
5. Embrace `$derived` for computed values instead of manual update() functions

**Next steps:**

1. Start with Breadcrumbs refactor (good learning exercise, medium complexity)
2. Move to Primary_Controls (most impact)
3. Extract compound components for complex UIs
4. Add slots where consumers need customization
5. Document the pattern for future components
