<script lang='ts'>
	import { k, u, ux, get, Thing, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_thing_color } from '../../ts/state/Reactive_State';
	import ColorPicker from 'svelte-awesome-color-picker';
	export let thing: Thing;
	export let left = 0;
	export let top = 0;
	const pickerSize = 122;
	const selectorSize = k.dot_size + 1;
	let colorAsHEX = k.empty;
	let persistenceTimer;

	onMount(() => {
		if (!!thing) {
			colorAsHEX = u.colorToHex(thing.color);
		}
	})

	function handleColorChange(event) {
		event.preventDefault();
		const color = event.detail.hex;
		if (thing.color != color) {
			thing.color = color;
			thing.signal_color_change();
			if (!!persistenceTimer) {
				clearTimeout(persistenceTimer);		// each color change discards and restarts the timer
			}
			persistenceTimer = setTimeout(() => {
				(async () => {
					$s_thing_color = null;
					await thing.remoteWrite();
				})();
			}, 100);		// tenth second delay
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
				top: {top}px;
				left: {left}px;
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
