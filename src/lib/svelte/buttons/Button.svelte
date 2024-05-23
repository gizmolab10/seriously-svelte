<script lang='ts'>
	import { g, k, u, Point, ZIndex, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	import Mouse from '../kit/Mouse.svelte';
	export let mouse_click_closure = (mouseData) => {};
	export let background_color = 'transparent';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let zindex = ZIndex.dots;
	export let cursor = 'pointer';
	export let border = 'none';
	export let style = k.empty;
	export let name = k.empty;
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let button;

</script>

<Mouse
	name={name}
	width={width}
	height={height}
	center={center}
	hover_closure={hover_closure}
	mouse_click_closure={mouse_click_closure}
	>
	<button class='button' id={name}
		bind:this={button}
		style='
			color: {color};
			cursor: {cursor};
			border: {border};
			width: {width}px;
			z-index: {zindex};
			height: {height}px;
			position: {position};
			background-color: {background_color};'>
			<slot></slot>
	</button>
</Mouse>
