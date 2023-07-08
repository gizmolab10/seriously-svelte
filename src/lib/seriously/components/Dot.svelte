<svelte:options immutable={true}/>

<script lang='ts'>
  import { Entity, grabbing, signal, handleSignal, SignalKinds } from '../common/imports.ts';
  export let isReveal = false;
  export let entity = Entity;
 
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
		if (kinds.includes(SignalKinds.dot)) {
      updateButtonColors();
    }
  });

  function updateButtonColors() {
    var style = document.getElementById(entity.id)?.style;
    style?.setProperty(  '--dotColor', entity.color);
    style?.setProperty( '--grabColor', entity.hoverColor( isReveal));
    style?.setProperty('--hoverColor', entity.hoverColor(!isReveal));
  }
</script>

<slot>
  <button id={entity.id}
    on:click={handleClick}
    class={ isReveal ? 'reveal' : 'drag' }
    style='--dotColor:   {entity.color};
           --grabColor:  {entity.hoverColor( isReveal)};
           --hoverColor: {entity.hoverColor(!isReveal)}'>
    {isReveal ? entity.trait : '-'}
  </button>
</slot>

<style lang='scss'>
  .reveal {}
  .drag {} // these are for drawing the drag dot differently than the reveal dot

  button {
    color: var(--hoverColor);
    background-color: var(--grabColor);
    border-color: var(--dotColor);
    border: 0.1px solid;
    border-radius: 10px;
    height: 20px;
    width: 20px;

    &:hover {
      color: var(--grabColor);
      background-color: var(--hoverColor);
    }
  }
</style>
