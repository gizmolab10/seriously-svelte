# Nested `{#if}` Race Conditions

**A store in an `{#if}` clause can create race conditions inside the clause.** When reactive stores change rapidly, nested `{#if}` blocks can be in transitional states (being created/destroyed) while the parent block tries to update them, causing this error:

`if_block.p is not a function`

## Table of Contents
- [Problem: Nested Blocks](#problem-nested-blocks)
- [Solution: Flatten Nested Blocks](#solution-flatten-nested-blocks)
- [Safe Patterns](#safe-patterns)
- [Best Practices](#best-practices)
- [Reference](#reference)

## Problem: Nested Blocks

Store `$A` is in the outer block, and condition `B` is in the inner block. When `$A` changes rapidly, the inner block can be in a transitional state (being created/destroyed) while the parent block tries to update it. The error really means "if_block is undefined."

**Before (problematic):**
```svelte
{#if !$A}
    {#if B && ancestry.points_right}
        <div class='numerical-count'>...</div>
    {/if}
{:else if !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## Solution: Flatten Nested Blocks

Flattening eliminates parent-child update coordination, allowing Svelte to update one block directly.

**After (fixed):**
```svelte
{#if !$A && B && ancestry.points_right}
    <div class='numerical-count'>...</div>
{:else if $A && !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## Safe Patterns

```svelte
<!-- Single level -->
{#if condition1 && condition2}
    ...
{/if}

<!-- Computed variable -->
<script>
    $: showContent = condition1 && condition2;
</script>
{#if showContent}
    ...
{/if}
```

## Best Practices

1. Flatten nested `{#if}` blocks when stores are involved
2. Use computed variables for complex conditions
3. Test mode switches and rapid state transitions

## Reference

`src/lib/svelte/widget/Widget_Reveal.svelte` (lines 166-198) - triggered when switching to radial mode

