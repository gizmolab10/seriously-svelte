# Svelte Gotchas: Nested `{#if}` Block Update Race Conditions

## Overview

This document explains a subtle Svelte compiler issue where nested `{#if}` blocks can cause this error during rapid state transitions:

`if_block.p is not a function` 

## Key Takeaway

**A store in an `{#if}` clause can cause timing issues inside the clause.** When reactive stores change rapidly, nested `{#if}` blocks can be in transitional states (being created/destroyed) while the parent block tries to update them, leading to errors.

## Use Case

When you nest `{#if}` blocks, Svelte's compiler generates update functions where the parent block's `p()` method must call the child block's `p()` method. During rapid state changes (like mode switches), the child block can be in a transitional state (being created or destroyed) where its `p` function doesn't exist yet or has been cleaned up, causing the error.

### Example: Widget_Reveal.svelte

**Before (nested ifs):**
```svelte
{#if !$w_show_countsAs_dots}
    {#if show_reveal_count && ancestry.points_right}
        <div class='numerical-count'>...</div>
    {/if}
{:else if !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## The Solution

**Flatten nested `{#if}` blocks** by combining conditions into a single level. This eliminates the parent-child update coordination, allowing Svelte to update one block directly without race conditions.

**After (flattened):**
```svelte
{#if !$w_show_countsAs_dots && show_reveal_count && ancestry.points_right}
    <div class='numerical-count'>...</div>
{:else if $w_show_countsAs_dots && !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## When This Occurs

- Rapid reactive dependency changes (e.g., mode switches like tree ↔ radial)
- Conditional rendering based on multiple reactive stores that update simultaneously
- Components that conditionally render based on computed properties that change during state transitions

## Safe Patterns

These patterns are generally safe:

```svelte
<!-- Single level is safe -->
{#if condition1 && condition2}
    ...
{/if}

<!-- Nested with static/stable conditions is usually safe -->
{#if alwaysTrue}
    {#if staticCondition}  <!-- ✅ Safe if condition rarely changes -->
        ...
    {/if}
{/if}

<!-- Computed variable instead of nesting -->
<script>
    $: showContent = condition1 && condition2;
</script>
{#if showContent}  <!-- ✅ Safe -->
    ...
{/if}
```

## Reference

- **File**: `src/lib/svelte/widget/Widget_Reveal.svelte`
- **Lines**: 166-198 (before fix)
- **Error**: `TypeError: if_block.p is not a function` at lines 167, 142, 114
- **Trigger**: Switching to radial mode when `ancestry.points_right` or `show_reveal_count` changes

## Best Practices

1. **Be cautious** with rapidly-changing reactive stores (esp. nested blocks)
2. **Flatten nested conditionals** or
3. **Use computed variables** for complex conditions
4. **Test all global state transitions** to catch these issues early

