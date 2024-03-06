<script>
	import { u, Size, ZIndex, svgPath } from '../../ts/common/GlobalImports';
    import { s_id_popupView } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
    export let size = 20;
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
    on:keypress={u.ignore}
    on:click={() => { $s_id_popupView = null; }}>
    <SVGD3
		width={size}
		height={size}
		scalablePath={circle}
	/>
    <SVGD3
		width={size}
		height={size}
		scalablePath={cross}
	/>
</div>
