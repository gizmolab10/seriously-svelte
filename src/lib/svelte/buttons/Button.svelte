<script lang='ts'>
	import { g, k, u, Point, ZIndex } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	import Mouse from '../kit/Mouse.svelte';
	export let background_color = 'transparent';
	export let closure = (mouseData) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let zindex = ZIndex.dots;
	export let cursor = 'pointer';
	export let border = 'none';
	export let color = 'black';
	export let style = k.empty;
	export let name = k.empty;
	export let height = 16;
	export let width = 16;

</script>

<Mouse
	name={name}
	width={width}
	height={height}
	center={center}
	cursor={cursor}
	closure={closure}>
	<button class='button' id={name}
		style='
			color: {color};
			cursor: {cursor};
			border: {border};
			width: {width}px;
			z-index: {zindex};
			height: {height}px;
			position: {position};
			border-radius: {height / 2}px;
			background-color: {background_color};'>
		<slot></slot>
	</button>
</Mouse>
