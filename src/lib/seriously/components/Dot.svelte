<svelte:options immutable={true}/>

<script lang='ts'>
  import { Thing, hereID, grabbing, tick, signal, handleSignal, SignalKinds } from '../common/imports.ts';
  export let isReveal = false;
  export let thing = Thing;
  let isGrabbed = false;
  let canExpand = false;
 
  function handleClick(event) {
    if (isReveal) {
      if (canExpand) {
        $hereID = thing.id;
      }
    } else if (event.shiftKeyb || isGrabbed) {
      grabbing.toggleGrab(thing);
    } else {
      grabbing.grabOnly(thing);
    }

    signal([SignalKinds.widget], thing.id);
  }

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.dot) && value == thing.id) {
      isGrabbed = grabbing.isGrabbed(thing);
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
