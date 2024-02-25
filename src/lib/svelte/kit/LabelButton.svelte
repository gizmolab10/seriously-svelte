<script lang='ts'>
	import { u, Point, ZIndex } from '../../ts/common/GlobalImports';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let border = 'none';
	export let onClick = null;
	export let color = 'gray';
	export let height = 16;
	export let width = 16;

	function mouseOut(event) { hover_closure(false); }
	function mouseOver(event) { hover_closure(true); }

</script>

<button class='label-button'
	on:click={onClick}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:mouseout={mouseOut}
	on:mouseover={mouseOver}
	style='
		color: {color};
		cursor: {cursor};
		border: {border};
		width: {width}px;
		height: {height}px;
		position: {position};
		z-index: {ZIndex.dots};
		background-color: white;
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;'>
	<slot></slot>
</button>
