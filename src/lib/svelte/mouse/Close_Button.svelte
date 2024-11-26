<script lang='ts'>
	import { k, u, Size, Point, ZIndex, svgPaths } from '../../ts/common/Global_Imports';
    import { s_id_popupView } from '../../ts/state/Svelte_Stores';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let stroke = k.color_default;
	let fill = k.color_background;

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
	align_left={false}
	origin={new Point(8, size / 2)}
	mouse_state_closure={hover_up_closure}>
    <SVGD3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={k.color_default}
		svg_path={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svg_path={svgPaths.x_cross(size, size / 6)}
	/>
</Mouse_Responder>
