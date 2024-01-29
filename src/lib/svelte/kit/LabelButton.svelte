<script lang='ts'>
	import { Point, ZIndex } from '../../ts/common/GlobalImports';
	export let border = 'none';		// 1px solid
	export let position = 'absolute';
	export let center = new Point();
	export let onClick = null;
	export let color = 'gray';
	// border: 1px solid;
	// border-radius: 1em;
</script>

<button class='label'
	on:click={onClick}
	style='color: {color};
		cursor: pointer;
		border: {border};
		top: {center.y}px;
		left: {center.x}px;
		position: {position};
		z-index: {ZIndex.dots};
		background-color: white'>
	<slot></slot>
</button>

<style>
</style>