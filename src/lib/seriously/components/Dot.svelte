<svelte:options immutable={true}/>

<script lang='ts'>
  import { Entity, grabbing, tick, signal, handleSignal, SignalKinds } from '../common/imports.ts';
  export let isReveal = false;
  export let entity = Entity;
  let isGrabbed = false;
 
  function handleClick(event) {
    if (!isReveal) {
      event.preventDefault();

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
      {isReveal ? grabbing.isGrabbed(entity) ? '+' : entity.trait : '-'}
    </button>
  </slot>
{/key}

<style lang='scss'>
  .reveal {}
  .drag {} // these are for drawing the drag dot differently than the reveal dot

  button {
    color: var(--textColor);
    background-color: var(--buttonColor);
    border-color: var(--dotColor);
    border: 1px solid;
    border-radius: 10px;
    height: 20px;
    width: 20px;

    &:hover {
      color: var(--buttonColor);
      background-color: var(--textColor);
    }
  }
</style>
