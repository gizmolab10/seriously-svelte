<script lang='ts'>
	import { k, u, Size, Point, T_Layer, svgPaths } from '../../ts/common/Global_Imports';
    import { w_id_popupView } from '../../ts/managers/Stores';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let stroke = k.color_default;
	let fill = k.color_background;

	function hover_up_closure(s_mouse) {
		if (s_mouse.isHover) {
			const isHovering = !s_mouse.isOut;
			fill = isHovering ? k.color_default : k.color_background;
			stroke = isHovering ? k.color_background : k.color_default;
		} else if (s_mouse.isUp) {
			$w_id_popupView = null;
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={size}
	height={size}
	align_left={false}
	origin={new Point(8, size / 2)}
	handle_mouse_state={hover_up_closure}>
    <SVGD3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={k.color_default}
		svgPath={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svgPath={svgPaths.x_cross(size, size / 6)}
	/>
</Mouse_Responder>
