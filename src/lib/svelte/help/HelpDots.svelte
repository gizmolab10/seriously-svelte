<script>
	import { Point } from "../../ts/common/GlobalImports";
	import { exemplar } from '../../ts/data/Exemplar';
	import Widget from '../widget/Widget.svelte';

	export function title(isSelected) {
		return isSelected ? 'How the <b>Dots</b> work' : 'Dots';
	}
</script>

<div>
	<div class='centered-container'>
		<Widget thing={exemplar} origin={new Point(150, 5)}/>
	</div>
	<br>
	<br>
	<ul class='help-ul'>
		<li class='help-li'>Click the dots (to right and left of each item) to display the items in the child [<b>browse right</b>] or parent list [<b>browse left</b>], respectively.
		<li class='help-li'>Hold the <i>Shift</i> key as you click to <b>add or remove</b> that item from the set of <b>selected</b> items.
		<li class='help-li'>The dots on the left side are for <b>selecting</b> an item or <b>browsing left</b>.
		<li class='help-li'>The dots on the right side (if one is there) of each menu item let you <b>browse to the right</b>.
		<li class='help-li'><b>Hovering</b> over a dot will reverse its color,
	</ul>
</div>

<style>
	@import '../../../styles/Help.css';
</style>
