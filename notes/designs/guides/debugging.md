# Debugging Guide

## Critical Principle: Verify Source Before Assuming Usage

**When something is undefined or not working, ALWAYS check the source first.**

### The Golden Rule

1. **Check where it comes from** (imports, destructuring, property access)
2. **Verify it exists on that object** (don't assume destructuring is correct)
3. **Then investigate how it's being used**

### Common Mistake Pattern

❌ **Wrong approach:**
- Variable is undefined
- Assume it's a usage/timing issue
- Try to fix with async/await, get(), etc.
- Miss that it's being accessed from the wrong object

✅ **Correct approach:**
- Variable is undefined
- **First**: Check where it's imported/destructured from
- **Second**: Verify it actually exists on that source object
- **Third**: Check if it should come from a different object
- **Then**: Investigate usage if source is correct

## Step-by-Step Debugging Process

### 1. When Something is Undefined

**Step 1: Verify the source**
```typescript
// If you see this:
const { w_s_title_edit } = s;

// Check:
// - Does `w_s_title_edit` exist on `s`?
// - Where is `w_s_title_edit` actually defined?
// - Should it come from a different object (x, u, etc.)?
```

**Step 2: Trace the definition**
- Use `grep` to find where the variable/property is defined
- Check the actual object it's defined on
- Verify the import/destructuring matches

**Step 3: Only then investigate usage**
- If source is correct, then check timing/async issues
- If source is wrong, fix that first

### 2. When Stores Don't Work

**Check order:**
1. Is the store imported correctly?
2. Is it destructured from the right object?
3. Is it the right store instance?
4. Then check if you need `get()` vs `$` syntax

### 3. When Async Functions Have Issues

**Check order:**
1. Are all variables/imports correct?
2. Are stores accessed correctly (capture value at start)?
3. Then check async/await timing

## Specific Patterns to Check

### Destructuring from Wrong Object

```typescript
// BAD: Assuming destructuring is correct
const { w_s_title_edit } = s;  // But w_s_title_edit is on x, not s!

// GOOD: Verify first
// 1. Find where w_s_title_edit is defined
// 2. Check which object it's on
// 3. Destructure from correct object
const { w_s_title_edit } = x;  // Correct!
```

### Store Access in Async Functions

```typescript
// BAD: Using $ syntax in async (won't work)
async function foo() {
    const value = $w_s_title_edit;  // ❌ Doesn't work in regular functions
}

// GOOD: Capture at function start
async function foo() {
    const s_text_edit = $w_s_title_edit;  // ✅ Works at function entry
    // Use s_text_edit (captured value) throughout
}
```

### Undefined After Async Operation

```typescript
// BAD: Assuming store is still available
async function foo() {
    await something();
    $w_s_title_edit.doSomething();  // ❌ Might be cleared
}

// GOOD: Capture before async
async function foo() {
    const s_text_edit = $w_s_title_edit;  // Capture first
    await something();
    if (s_text_edit) {  // Check captured value
        s_text_edit.doSomething();
    }
}
```

## Verification Checklist

Before assuming a usage issue, verify:

- [ ] Is the variable/property imported correctly?
- [ ] Is it destructured from the correct object?
- [ ] Does it actually exist on that object? (check definition)
- [ ] Is it the right instance/type?
- [ ] Are there any typos in the name?

Only after all of the above are verified should you investigate:
- Timing issues
- Async/await problems
- Store reactivity issues
- Scope/context problems

## Tools to Use

1. **grep**: Find where something is defined
   ```bash
   grep -r "w_s_title_edit\s*=" src/
   ```

2. **codebase_search**: Find where something is used/defined
   ```typescript
   codebase_search("Where is w_s_title_edit defined?")
   ```

3. **read_file**: Check the actual definition
   ```typescript
   read_file("path/to/file.ts")
   ```

## Remember

**The most common mistake is assuming the source is correct and jumping to usage fixes. Always verify the source first.**

