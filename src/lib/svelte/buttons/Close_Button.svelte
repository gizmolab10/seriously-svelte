<script lang='ts'>
	import { k, u, Size, Point, colors, T_Layer, svgPaths } from '../../ts/common/Global_Imports';
    import { w_popupView_id, w_background_color } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let stroke = colors.default;
	let fill = $w_background_color;

	function hover_up_closure(s_mouse) {
		if (s_mouse.isHover) {
			const isHovering = !s_mouse.isOut;
			fill = isHovering ? colors.default : $w_background_color;
			stroke = isHovering ? $w_background_color : colors.default;
		} else if (s_mouse.isUp) {
			$w_popupView_id = null;
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
    <SVG_D3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={colors.default}
		svgPath={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVG_D3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svgPath={svgPaths.x_cross(size, size / 6)}
	/>
</Mouse_Responder>
