<script>
	import { u, onMount, signals } from '../../ts/common/GlobalImports';
	import { s_ancestries_grabbed } from '../../ts/state/State';
	export let thing;
	let color = '#ff0000';
	const left = 100;
	const top = 50;

	$: { updateFor($s_ancestries_grabbed); }
	onMount(() => { updateFor($s_ancestries_grabbed); })

	function updateFor(grabs) {
		if (grabs.length > 0) {
			const grabbed = grabs[0].thing;
			if (!!grabbed && grabbed != thing) {
				thing = grabbed;
				color = u.colorToHex(thing.color);
			}
		}
	}

	function handleColorChange(event) {
		event.preventDefault();
		thing.color = event.target.value;
		signals.signal_thingChanged(thing.id);
	}

</script>

{#key color}
	<div style='top:{top + 5}px; left:40px; position:absolute;'>color of selection:</div>
	<input class='color-input'
		style='
			top: {top}px;
			cursor: pointer;
			position: absolute;
			left: {left + 39}px;'
		on:input={handleColorChange}
		bind:value={color}
		id='color-picker'
		type='color'>
{/key}
