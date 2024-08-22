<script>
	import { k, u, Point, debug, ZIndex, onMount } from '../../ts/common/Global_Imports'
	export let font_family = 'Arial, sans-serif';
	export let center = Point.zero;
	export let font_size = 20;
	export let text = k.space;
	export let color = 'red';
	export let angle = 0;

	// Calculate degrees from radians for CSS rotation
	$: angleDeg = angle * 180 / Math.PI;
</script>

<div class='angled-text'
	style='
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;
		transform: translate(-50%, -50%) rotate({angleDeg}deg);'>
	<span class='text'
		style='
			font-family: {font_family};
			font-size: {font_size}px;
			color: {color};'>
		{text}
	</span>
</div>
