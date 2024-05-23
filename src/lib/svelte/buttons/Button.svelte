<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	import Mouse from '../kit/Mouse.svelte';
	export let mouse_click_closure = (event, isLong, isUp, isDouble) => {};
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
	<Mouse
		center={center}
		mouse_click_closure={mouse_click_closure}
		hover_closure={hover_closure}
		height={height}
		width={width}
		name={name}>
		<slot></slot>
	</Mouse>
</button>
