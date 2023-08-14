<script lang='ts'>
  import { Thing, onMount } from '../common/GlobalImports';
  import { grabbedIDs } from '../managers/State';
  export let isReveal = false;
  export let thing = Thing;
  export let size = 15;
  let buttonColor = thing.color;
  let traitColor = thing.color;
  const dotColor = thing.color;
	let isGrabbed = false;
  let dot = null;

  onMount( () => { updateColorStyle(); });

	$: {
		const grabbed = $grabbedIDs?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColorStyle();
		}
	}

  function updateColorStyle() {
    thing.updateColorAttributes();
    traitColor = thing.revealColor(isReveal);
    buttonColor = thing.revealColor(!isReveal);
	}

  async function handleClick(event) {
    if (thing.isExemplar) { return; }
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

<slot>
  <button
    bind:this={dot}
    on:click={handleClick}
    style='width:{size}px; height:{size}px;
      border-color: {dotColor};
      color: {traitColor};
      background-color: {buttonColor};'
      on:mouseover={dot.style.backgroundColor=traitColor}
      on:mouseout={dot.style.backgroundColor=buttonColor}>
  </button>
</slot>

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
  }
</style>
