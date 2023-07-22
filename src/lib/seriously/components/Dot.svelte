<svelte:options immutable={true}/>

<script lang='ts'>
  import { Thing, things, hereID, grabbedIDs, reassignOrdersOf, tick, onMount, signal, handleSignal, SignalKinds, seriouslyGlobals } from '../common/GlobalImports.ts';
  export let isReveal = false;
  export let thing = Thing;

  async function handleClick(event) {
    if (isReveal) {
      if (thing.canExpand) {
        reassignOrdersOf(thing.children);
        thing.firstChild?.grabOnly();
        $hereID = thing.id;
        await things.updateDirtyThingsInCloud();
      }
    } else if (event.shiftKey) {
      thing.toggleGrab();
    } else if ($hereID != seriouslyGlobals.rootID && $grabbedIDs?.includes(thing.id)) {
      thing.moveRightAndRedraw(false, false);
    } else {
      thing.grabOnly();
    }

    signal([SignalKinds.widget], thing.id);
  }

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.dot) && value == thing.id) {
      var style = document.getElementById(thing.id)?.style;
      style?.setProperty(   '--dotColor', thing.color);
      style?.setProperty( '--traitColor', thing.revealColor(!isReveal));
      style?.setProperty('--buttonColor', thing.revealColor( isReveal));
    }
  })

</script>

{#key $grabbedIDs?.includes(thing.id)}
  <slot>
    <button id={thing.id}
      on:click={handleClick}
      class={ isReveal ? 'reveal' : 'drag' }
      style='--dotColor: {thing.color};
           --traitColor: {thing.revealColor(!isReveal)};
          --buttonColor: {thing.revealColor( isReveal)}'>
    </button>
  </slot>
{/key}

<style lang='scss'>
  .reveal {}
  .drag {} // these are for drawing the drag dot differently than the reveal dot

  button {
    top: 1px;
    left: 3px;
    position: relative;
    display: relative;
    align-items: center;
    justify-content: center;
    color: var(--traitColor);
    border-color: var(--dotColor);
    background-color: var(--buttonColor);
    border: 1px solid;
    border-radius: 0.7em;
    width: 0.7em;
    height: 1.1em;

    &:hover {
      color: var(--buttonColor);
      background-color: var(--traitColor);
    }
  }
</style>
