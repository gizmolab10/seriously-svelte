# Book

## Problem

This is getting to be a lot of material. Perhaps overwhelming to a newbie. I want to understand what's missing and how to inject it.

## Goal

Document what makes great technical writing feel great, how to achieve it, and what raw material is needed to get started.

## Approach

### What Makes Great Technical Books Feel Good

**Narrative thread.** Not just facts dumped in order. There's a story — here's where we started, here's the problem we hit, here's how we solved it. Even dry topics have a journey.

**Voice.** A human wrote this. You can hear them thinking. They have opinions, frustrations, moments of delight. Not corporate-speak, not textbook-neutral.

**Pacing.** Dense sections followed by breathers. Code blocks broken up by explanation. Short sentences after complex ones. Rhythm.

**Earned complexity.** Simple first, then build. Never dump the hard stuff without setup. Each concept earns its place by solving a problem you now understand.

**Concrete before abstract.** Show the specific case, then generalize. "Here's what happened" before "here's the principle."

**Respect for the reader.** Assumes intelligence, doesn't assume knowledge. Explains without condescending. Doesn't hide difficulty but doesn't exaggerate it either.

**Moments of humor or humanity.** A wry aside. An admission of a dumb mistake. Keeps you reading because the author feels real.

### How To Do It

1. **Start with the pain.** What sucked? What was confusing? What broke? That's your hook.
2. **Tell the story of figuring it out.** Not "here's the answer" but "here's how I got there." Include dead ends if they're instructive.
3. **Use your actual voice.** Read it aloud. Does it sound like you talking? If not, rewrite.
4. **Vary sentence length.** Long explanation. Short punch. Like this.
5. **One idea per paragraph.** If you're covering two things, split it.
6. **Code in context.** Don't just show code — show why this code, why now, what it replaces.
7. **Name the tradeoffs.** Nothing is perfect. Say what you gave up.
8. **End sections with what you now know.** Summarize the takeaway. Cement it.

### Starting Material Needed

* **A problem you actually solved.** Not hypothetical. Real friction, real fix.
* **Notes from the journey.** What you tried, what failed, what clicked. Raw is fine.
* **Code snippets.** Before/after. The ugly version and the clean version.
* **Your opinions.** What do you think about this? Don't hedge everything.
* **Questions you had.** What confused you? Others will be confused too.

### What's Likely Missing

1. **"Start here" entry point.** Where does a newbie begin? The digest lists everything equally. No hierarchy of "read this first."

2. **Progressive path.** A suggested reading order. "Understand state before managers. Understand managers before UX."

3. **Context-setting intro.** "What is webseriously? What problem does it solve? Why is it built this way?" Before diving into components and databases.

4. **Glossary or quick reference.** All those prefixes (S_, w_, G_, T_) — a newbie sees them everywhere with no decoder ring upfront.

5. **"Big picture" diagram.** How the pieces connect. Visual map before detailed terrain.

## Audit

### Entry Points

| Doc | Has "start here" feel? | Notes |
|-----|------------------------|-------|
| digest.md | ❌ | Lists everything flat, no guidance |
| designs/index.md | ❌ | Just links, no context |
| architecture/index.md | ❌ | Lists managers, no intro |
| guides/index.md | ⚠️ | Has a sentence of context, but not newbie-oriented |

### Progressive Path

*Does any doc explain dependencies between concepts?*

| Concept | Depends on | Documented? |
|---------|-----------|-------------|
| managers | state | ❌ |
| UX | managers, state | ❌ |
| hits | state, geometry | ❌ |
| components | state, managers | ❌ |

### Context-Setting

*Does anything explain what webseriously IS?*

- [ ] What problem does it solve?
- [ ] Who is it for?
- [ ] Why these architectural choices?
- [ ] High-level "here's how it works"

### Glossary

*Are prefixes explained anywhere?*

| Prefix | Explained in | Findable? |
|--------|-------------|-----------|
| S_ | state.md | ⚠️ buried |
| w_ | state.md | ⚠️ buried |
| G_ | geometry.md | ⚠️ buried |
| T_ | style.md | ⚠️ in naming section |
| k, h, s, x, g, p, u, e, c | style.md | ⚠️ in prefixes table |

### Big Picture

*Visual overview exists?*

- [ ] Architecture diagram
- [ ] Data flow diagram
- [ ] Component relationship map

## Resolution

*Pending — decide what to create first.*
