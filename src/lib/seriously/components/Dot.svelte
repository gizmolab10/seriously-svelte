<svelte:options immutable={true}/>

<script lang='ts'>
  import { Entity, grabbing, tick, signal, handleSignal, SignalKinds } from '../common/imports.ts';
  export let isReveal = false;
  export let entity = Entity;
  let isGrabbed = false;
 
  function handleClick(event) {
    if (!isReveal) {
      if (event.shiftKey) {
        grabbing.toggleGrab(entity);
      } else {
        grabbing.grabOnly(entity);
      }

      signal([SignalKinds.widget], entity.id);
    }
  }

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.dot) && value == entity.id) {
      isGrabbed = grabbing.isGrabbed(entity);
      var style = document.getElementById(entity.id)?.style;
      style?.setProperty(   '--dotColor', entity.color);
      style?.setProperty(  '--textColor', entity.revealColor(!isReveal));
      style?.setProperty('--buttonColor', entity.revealColor( isReveal));
    }
  })

</script>

{#key isGrabbed}
  <slot>
    <button id={entity.id}
      on:click={handleClick}
      class={ isReveal ? 'reveal' : 'drag' }
      style='--dotColor: {entity.color};
            --textColor: {entity.revealColor(!isReveal)};
          --buttonColor: {entity.revealColor( isReveal)}'>
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
