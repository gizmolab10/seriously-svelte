<script>
	import { u, onMount, signals } from '../../ts/common/GlobalImports';
	import { s_ancestries_grabbed } from '../../ts/state/State';
	import ColorPicker from 'svelte-awesome-color-picker';
	let colorAsHEX = '#ff00ff';
	const left = 100;
	const top = 50;
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
		thing.color = event.detail.hex;
		signals.signal_thingChanged(thing.id);
	}

</script>

{#key colorAsHEX}
	<div style='top:{top + 5}px; left:40px; position:absolute;'>
		<ColorPicker
			hex={colorAsHEX}
			atRight=0
			on:input={handleColorChange}
			label='color of selection'/>
	</div>
{/key}
