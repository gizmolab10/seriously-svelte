<script lang='ts'>
	import { k, u, Size, Point, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
    import { s_id_popupView } from '../../ts/state/ReactiveState';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let fill = k.color_background;
	let stroke = 'black';
    const cross = svgPaths.x_cross(size, size / 6);
    const circle = svgPaths.circle_atOffset(size, size - 2);

	function closure(mouseState) {
		if (mouseState.isHover) {
			const isHovering = !mouseState.isOut;
			fill = isHovering ? 'black' : k.color_background;
			stroke = isHovering ? k.color_background : 'black';
		} else if (mouseState.isUp) {
			$s_id_popupView = null;
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={size}
	height={size}
	cursor='pointer'
	closure={closure}
	align_left={false}
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
</Mouse_Responder>
