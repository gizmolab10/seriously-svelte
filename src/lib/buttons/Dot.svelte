<script lang='ts'>
  import { Thing, grabbedIDs, onDestroy, Signals, signal, handleSignalOfKind, Rounded, Direction, constants } from '../common/GlobalImports';
  export let isReveal = false;
  export let thing = Thing;
  export let size = 20;
  const top = 4;
  const rounded = new Rounded(size, Direction.right);
  const path = rounded.path;
  let width = 20;
  let height = 20;
  const colors = '--dotColor: {thing.color}; --traitColor: {thing.revealColor(!isReveal)}; --buttonColor: {thing.revealColor( isReveal)};';

	onDestroy( () => { signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.dots, (value) => {
    if (value == thing.id) {
      var style = document.getElementById(thing.id)?.style;
      style?.setProperty(   '--dotColor', thing.color);
      style?.setProperty( '--traitColor', thing.revealColor(!isReveal));
      style?.setProperty('--buttonColor', thing.revealColor( isReveal));
    }
  })

  async function handleClick(event) {
    if (isReveal) {
      if (thing.hasChildren) {
        thing.redraw_browseRight(true);
      }
    } else if (event.shiftKey) {
      thing.toggleGrab();
    } else if ($grabbedIDs?.includes(thing.id)) {
      thing.redraw_browseRight(false);
    } else {
      thing.grabOnly();
    }
  }

</script>

{#key $grabbedIDs?.includes(thing.id)}
  <slot>
    {#if isReveal}
      <svg width='{width}' height='{height}' viewBox='0 -8 {width} {height}'
        on:click={handleClick}>
        style={colors}>
        <path class="button-triangle" d={path} />
      </svg>
    {:else}
      <button id={thing.id}
        on:click={handleClick}
        style='width:{size}px; height:{size}px;
               --dotColor: {thing.color};
             --traitColor: {thing.revealColor(!isReveal)};
            --buttonColor: {thing.revealColor( isReveal)}'>
      </button>
    {/if}
  </slot>
{/key}

<style lang='scss'>
  button {
    top: 1px;
    border: 1px solid;
    border-radius: 50%;
  }

  button, .button-triangle {
    left: 3px;
    position: relative;
    cursor: pointer;
    color: var(--traitColor);
    border-color: var(--dotColor);
    background-color: var(--buttonColor);

    &:hover {
      color: var(--buttonColor);
      background-color: var(--traitColor);
    }
  }
</style>
