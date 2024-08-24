<script lang='ts'>
	import { s_thing_changed, s_rebuild_count, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import ColorPicker from 'svelte-awesome-color-picker';
	const selectorSize = k.dot_size;
	const pickerSize = 100;
	let colorAsHEX = '#F0F';
	let persistenceTimer;
	let thing;

	$: { updateFor($s_ancestries_grabbed); }
	onMount(() => { updateFor($s_ancestries_grabbed); })

	function updateFor(grabs) {
		if (grabs.length > 0) {
			const grabbed = grabs[0].thing;
			if (!!grabbed && grabbed != thing) {
				thing = grabbed;
				colorAsHEX = u.colorToHex(thing.color);
			}
		}
	}

	function handleColorChange(event) {
		event.preventDefault();
		const rebuild_count = get(s_rebuild_count) + 1;
		s_rebuild_count.set(rebuild_count);
		thing.color = event.detail.hex;
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
		}, 100);		// tenth second delay
	}

</script>

{#if !!thing}
	{#key thing.id}
		<div style='top:55px; left:10.5px; position:absolute;'>
			<ColorPicker
				hex={colorAsHEX}
				on:input={handleColorChange}
				--input-size='{selectorSize}px'
				--picker-width='{pickerSize}px'
				--picker-height='{pickerSize}px'
				--slider-width='{selectorSize}px'
				--picker-z-index='{ZIndex.frontmost}'
				--picker-indicator-size='{selectorSize}px'
				label='color of "{thing.title.injectEllipsisAt()}"'/>
		</div>
	{/key}
{/if}
