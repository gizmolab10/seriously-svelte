<script>
	import { Size, ZIndex, svgPath } from '../../ts/common/GlobalImports';
    import { id_popupView } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
    export let size = 20;
	function ignore(event) {}
    const cross = svgPath.xCross(size, size / 6);
    const circle = svgPath.circle(size, size - 2);
</script>

<style>
	.close-button {
		border: 0px;
		cursor: pointer;
		position: absolute;
	}
</style>

<div class='close-button' style='top: {size * 0.5}px; right: {size * 1.5}px;'
    on:keypress={ignore}
    on:click={() => { $id_popupView = null; }}>
    <SVGD3
		path={circle}
		stroke='black'
		position='absolute'
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
    <SVGD3
		path={cross}
		stroke='black'
		position='absolute'
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
</div>
