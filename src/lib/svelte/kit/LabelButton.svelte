<script lang='ts'>
	import { u, Point, ZIndex } from '../../ts/common/GlobalImports';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let border = 'none';
	export let onClick = null;
	export let color = 'gray';

	function mouseOut(event) { hover_closure(false); }
	function mouseOver(event) { hover_closure(true); }

</script>

<style>
</style>

<button class='label'
	on:click={onClick}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:mouseout={mouseOut}
	on:mouseover={mouseOver}
	style='
		color: {color};
		cursor: pointer;
		border: {border};
		top: {center.y}px;
		left: {center.x}px;
		position: {position};
		z-index: {ZIndex.dots};
		background-color: white'>
	<slot></slot>
</button>
