<script>
	import { u, Size, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
    import { s_id_popupView } from '../../ts/state/State';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let size = 20;
    const cross = svgPaths.x_cross(size, size / 6);
    const circle = svgPaths.circle_atOffset(size, size - 2);
</script>

<style>
	.close-button {
		border: 0px;
		cursor: pointer;
		position: absolute;
	}
</style>

<div class='close-button' style='top: {size * 0.5}px; right: {size * 1.5}px;'
    on:keypress={u.ignore}
    on:click={() => { $s_id_popupView = null; }}>
    <SVGD3 name='close'
		width={size}
		height={size}
		svg_path={circle}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		svg_path={cross}
	/>
</div>
