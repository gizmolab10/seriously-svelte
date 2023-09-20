<script lang='ts'>
	import { noop, Thing, onMount, constants, BrowserType, getBrowserType } from '../../ts/common/GlobalImports';
	import { idsGrabbed } from '../../ts/managers/State';
	export let isReveal = false;
	export let thing = Thing;
	export let size = 14;
	let placement = 'left: 5px; top: 4px;'
	const browserType = getBrowserType();
	let buttonColor = thing.color;
	let traitColor = thing.color;
	const dotColor = thing.color;
	let isGrabbed = false;
	let dot = null;

	onMount( () => { updateColorStyle(); });

	$: {
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColorStyle();
		}
		
		if (browserType != BrowserType.chrome) {
			placement = 'top: 2px; left: 5px;'
		}
	}

	function updateColorStyle() {
		thing.updateColorAttributes();
		traitColor = thing.revealColor(!isReveal);
		buttonColor = thing.revealColor(isReveal);
	}

	async function handleClick(event) {
		if (thing.isExemplar) { return; }
		if (isReveal) {
			if (thing.hasChildren) {
				thing.redraw_browseRight(true);
			}
		} else if (event.shiftKey || isGrabbed) {
			thing.toggleGrab();
		} else {
			thing.grabOnly();
		}
	}

</script>

<button
	bind:this={dot}
	on:blur={noop()}
	on:focus={noop()}
	on:keypress={noop()}
	on:click={handleClick}
	on:mouseover={dot.style.backgroundColor=traitColor}
	on:mouseout={dot.style.backgroundColor=buttonColor}
	style='width:{size}px; height:{size}px; z-index: {constants.baseZIndex + 40};
		border-color: {dotColor};
		color: {traitColor};
		{placement}
		background-color: {buttonColor};'>
</button>

<style lang='scss'>
	button {
		cursor: pointer;
		display: relative;
		border: 1px solid;
		border-radius: 50%;
		position: relative;
		align-items: center;
		justify-content: center;
	}
</style>
