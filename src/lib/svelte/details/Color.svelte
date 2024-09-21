<script lang='ts'>
	import { k, u, ux, get, Thing, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_rebuild_count, s_thing_changed } from '../../ts/state/Reactive_State';
	import ColorPicker from 'svelte-awesome-color-picker';
	export let thing: Thing;
	const selectorSize = k.dot_size + 1;
	const pickerSize = 100;
	let colorAsHEX = '#F0F';
	let persistenceTimer;

	$: { updateFor(thing); }

	function updateFor(thing) {
		colorAsHEX = u.colorToHex(thing.color);
	}

	function handleColorChange(event) {
		event.preventDefault();
		const rebuild_count = get(s_rebuild_count) + 1;
		const color = event.detail.hex;
		thing.color = color;
		s_rebuild_count.set(rebuild_count);
		$s_thing_changed = `${thing.id}${k.generic_separator}${rebuild_count}`;
		if (!!persistenceTimer) {
			clearTimeout(persistenceTimer);		// each color change discards and restarts the timer
			persistenceTimer = null;
		}
		persistenceTimer = setTimeout(() => {
			(async () => {
				$s_thing_changed = null;
				await thing.remoteWrite();
			})();
		}, 1000);		// tenth second delay
	}

</script>

{#if !!thing}
	{#key thing.id}
		<ColorPicker
			hex={colorAsHEX}
			on:input={handleColorChange}
			--input-size='{selectorSize}px'
			--picker-width='{pickerSize}px'
			--picker-height='{pickerSize}px'
			--slider-width='{selectorSize}px'
			--picker-z-index='{ZIndex.frontmost}'
			--picker-indicator-size='{selectorSize}px'
			label=''/>
	{/key}
{/if}
