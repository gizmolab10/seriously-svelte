<script lang='ts'>
	import { k, u, Size, Point, ZIndex, svgPaths } from '../../ts/common/Global_Imports';
    import { s_id_popupView } from '../../ts/state/Reactive_State';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let fill = k.color_background;
	let stroke = k.color_default;
    const svg_cross_path = svgPaths.x_cross(size, size / 6);
    const svg_circle_path = svgPaths.circle_atOffset(size, size - 2);

	function hover_up_closure(mouse_state) {
		if (mouse_state.isHover) {
			const isHovering = !mouse_state.isOut;
			fill = isHovering ? k.color_default : k.color_background;
			stroke = isHovering ? k.color_background : k.color_default;
		} else if (mouse_state.isUp) {
			$s_id_popupView = null;
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={size}
	height={size}
	cursor='pointer'
	align_left={false}
	center={Point.y(size)}
	mouse_state_closure={hover_up_closure}>
    <SVGD3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke=k.color_default
		svg_path={svg_circle_path}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svg_path={svg_cross_path}
	/>
</Mouse_Responder>
