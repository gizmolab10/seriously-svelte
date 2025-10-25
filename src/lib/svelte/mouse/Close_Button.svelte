<script lang='ts'>
	import { k, u, Size, Point, colors, T_Layer, svgPaths } from '../../ts/common/Global_Imports';
    import { w_popupView_id, w_background_color } from '../../ts/managers/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	export let align_left: boolean = false;
	export let stroke_width: number = 0.75;
    export let name = 'generic close';
	export let closure: () => void;
	export let origin: Point;
    export let size = 20;
	let stroke = colors.default;
	let fill = 'white';

	function handle_s_mouse(s_mouse) {
		if (s_mouse.hover_didChange) {
			const isHovering = !s_mouse.isOut;
			fill = isHovering ? colors.default : 'white';
			stroke = isHovering ? $w_background_color : colors.default;
		} else if (s_mouse.isUp) {
			closure();
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={size}
	height={size}
	origin={origin}
	align_left={align_left}
	handle_s_mouse={handle_s_mouse}>
    <SVG_D3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={colors.default}
		stroke_width={stroke_width}
		svgPath={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVG_D3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		stroke_width={1}
		svgPath={svgPaths.x_cross(size, size / 6)}
	/>
</Mouse_Responder>
