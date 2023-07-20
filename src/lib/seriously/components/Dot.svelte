<svelte:options immutable={true}/>

<script lang='ts'>
  import { Thing, things, hereID, grabbedIDs, reassignOrdersOf, tick, onMount, signal, handleSignal, SignalKinds, seriouslyGlobals } from '../common/GlobalImports.ts';
  export let isReveal = false;
  export let thing = Thing;
  let isGrabbed = false;
  let canExpand = thing.children.length > 0;
 
  $: {
    isGrabbed = $grabbedIDs?.includes(thing.id);
  }

  async function handleClick(event) {
    if (isReveal) {
      console.log('isReveal');
      if (canExpand) {
        console.log('expand');
        reassignOrdersOf(thing.children);
        thing.firstChild?.grabOnly();
        $hereID = thing.id;
        await things.updateThingsInCloud(thing.children);
      }
    } else if ($hereID != seriouslyGlobals.rootID) {
      thing.moveRightAndRedraw(false, false);
    } else if (event.shiftKeyb || isGrabbed) {
      thing.toggleGrab();
    } else {
      thing.firstChild?.grabOnly();
    }

    signal([SignalKinds.widget], thing.id);
  }

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.dot) && value == thing.id) {
      canExpand = thing.children.length > 0;
      var style = document.getElementById(thing.id)?.style;
      style?.setProperty(   '--dotColor', thing.color);
      style?.setProperty(  '--textColor', thing.revealColor(!isReveal));
      style?.setProperty('--buttonColor', thing.revealColor( isReveal));
    }
  })

</script>

{#key isGrabbed}
  <slot>
    <button id={thing.id}
      on:click={handleClick}
      class={ isReveal ? 'reveal' : 'drag' }
      style='--dotColor: {thing.color};
            --textColor: {thing.revealColor(!isReveal)};
          --buttonColor: {thing.revealColor( isReveal)}'>
          {#if isReveal && canExpand}
          +
          {/if}
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
    color: var(--textColor);
    border-color: var(--dotColor);
    background-color: var(--buttonColor);
    border: 1px solid;
    border-radius: 0.7em;
    width: 0.7em;
    height: 1.1em;

    &:hover {
      color: var(--buttonColor);
      background-color: var(--textColor);
    }
  }
</style>
