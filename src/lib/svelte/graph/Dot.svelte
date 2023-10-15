<script lang='ts'>
	import { noop, Thing, onMount, ZIndex, signal, Signals, BrowserType, getBrowserType, dbDispatch } from '../../ts/common/GlobalImports';
	import { idsGrabbed, dotDiameter } from '../../ts/managers/State';
	export let isReveal = false;
	export let thing = Thing;
	let placement = 'left: 5px; top: 4px;' // tiny browser compensation
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
		const buttonFlag = (isReveal && (!thing.isExpanded || isGrabbed));
		traitColor = thing.revealColor(!isReveal || isGrabbed);
		buttonColor = thing.revealColor(buttonFlag);
	}

	async function handleClick(event) {
		if (thing.isExemplar) { return; }
		if (isReveal) {
			if (thing.needsBulkFetch) {
				thing.redraw_fetchAll_runtimeBrowseRight(false);
			} else {
				thing.toggleExpand();
				signal(Signals.childrenOf);
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
	style='{placement}
		width:{$dotDiameter}px;
		height:{$dotDiameter}px;
		z-index: {ZIndex.text};
		background-color: {buttonColor};
		border-color: {dotColor};
		color: {traitColor};'>
</button>

<style lang='scss'>
	button {
		min-width: 1px;
		cursor: pointer;
		border: 1px solid;
		border-radius: 50%;
		position: relative;
	}
</style>
