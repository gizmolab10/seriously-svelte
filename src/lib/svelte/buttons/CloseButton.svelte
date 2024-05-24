<script>
	import { u, Size, Point, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
    import { s_id_popupView } from '../../ts/state/State';
	import Mouse from '../kit/Mouse.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let size = 20;
	let fill = 'white';
	let stroke = 'black';
    const cross = svgPaths.x_cross(size, size / 6);
    const circle = svgPaths.circle_atOffset(size, size - 2);

	function mouse_closure(mouseData) {
		if (mouseData.isHover) {
			const isHovering = !mouseData.isOut;
			fill = isHovering ? 'black' : 'white';
			stroke = isHovering ? 'white' : 'black';
		} else if (mouseData.isDown) {
			$s_id_popupView = null;
		}
	}

</script>

<style>
	.close-button {
		border: 0px;
		cursor: pointer;
		position: absolute;
	}
</style>

<Mouse
	width={size}
	height={size}
	align_left={false}
	name='close-button'
	closure={mouse_closure}
	center={new Point(0, size)}>
    <SVGD3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke='black'
		svg_path={circle}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svg_path={cross}
	/>
</Mouse>
