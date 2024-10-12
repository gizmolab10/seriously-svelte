<script lang='ts'>
	import { k, u, ux, get, Point, Thing, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_color_thing } from '../../ts/state/Reactive_State';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { h } from '../../ts/db/DBDispatch';
	export let origin = Point.zero;
	export let thing: Thing;
	const pickerSize = 122;
	const selectorSize = k.dot_size + 1;
	let colorAsHEX = k.empty;

    onMount(() => {
		if (!!thing) {
			colorAsHEX = u.colorToHex(thing.color);
		}
	});

	function handleColorChange(event) {
		event.preventDefault();
		const color = event.detail.hex;
		if (thing.color != color) {
			thing.color = color;
			thing.signal_color_change();
			thing.remoteWrite();
		}
	}
	
</script>

<style>
	div :global(.wrapper) {
		left: -8px;
		top: 26px;
	}

	div :global(.picker-indicator) {
		border-radius: 50%;
	}
</style>


{#if !!thing}
	{#key thing.id}
		<div class='color'
			style='
				top: {origin.y}px;
				left: {origin.x}px;
				position: absolute;
				z-index: {ZIndex.frontmost};'>
			<ColorPicker
				hex={colorAsHEX}
				on:input={handleColorChange}
				--input-size='{selectorSize}px'
				--picker-width='{pickerSize}px'
				--picker-height='{pickerSize}px'
				--slider-width='{selectorSize}px'
				--picker-z-index='{ZIndex.frontmost}'
				--picker-indicator-size='{selectorSize}px'
				label='color'/>
		</div>
	{/key}
{/if}
