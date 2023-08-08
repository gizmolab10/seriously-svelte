<script lang='ts'>
  import { Thing, grabbedIDs, onDestroy, Signals, handleSignalOfKind } from '../common/GlobalImports';
  export let isReveal = false;
  export let thing = Thing;
  export let size = 15;

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
    <button id={thing.id}
      on:click={handleClick}
      style='width:{size}px; height:{size}px;
             --dotColor: {thing.color};
           --traitColor: {thing.revealColor(!isReveal)};
          --buttonColor: {thing.revealColor( isReveal)}'>
    </button>
  </slot>
{/key}

<style lang='scss'>
  button {
    top: 1px;
    left: 3px;
    cursor: pointer;
    display: relative;
    border: 1px solid;
    border-radius: 50%;
    position: relative;
    align-items: center;
    justify-content: center;
    color: var(--traitColor);
    border-color: var(--dotColor);
    background-color: var(--buttonColor);

    &:hover {
      color: var(--buttonColor);
      background-color: var(--traitColor);
    }
  }
</style>
