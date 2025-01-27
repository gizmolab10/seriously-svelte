<script lang='ts'>
	import { k, u, Rect, Size, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { svgPaths, T_Oblong, G_Segment } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let hit_closure = (title, shift) => {};
	export let fill = k.color_background;
	export let g_segment!: G_Segment;
    export let name = g_segment.title;
	export let stroke = k.color_default;
	const segment_name = `${name}-segment`;
	let title_color = k.color_default;
	let size = g_segment.size;
	let isHovering = false;

	update_colors();

	function update_colors() {
		title_color = isHovering ? k.color_background : k.color_default ;
		fill = isHovering ? k.color_default : g_segment.isSelected ? u.opacitize('skyblue', 0.6) : k.color_background;
		debug.log_segments(`${name} ${g_segment.isSelected ? 'selected' : ''} ${fill}`)
	}

	function up_hover_closure(mouse_state) {
		if (mouse_state.isHover) {
			isHovering = !mouse_state.isOut;
		} else if (mouse_state.isUp) {
			hit_closure(name, mouse_state.event?.isShift ?? false);
		}
		update_colors();
	}

</script>

<Mouse_Responder
	cursor='pointer'
	width={size.width}
	name={segment_name}
	height={size.height}
	zindex={T_Layer.frontmost}
	origin={g_segment.origin}
	mouse_state_closure={up_hover_closure}>
	<svg
		id={`${name}`}
		class='segment-svg'
		viewBox={g_segment.viewBox}
		style='
			height:{size.height}px;
			width:{size.width}px;
			position: absolute;
			left:0px;'>
		<path
			class='segment-path'
			d={g_segment.path}
			stroke-width=0.3px
			stroke={stroke}
			id={`${name}`}
			fill={fill}/>
	</svg>
	<div
		class='title'
		style='
			left:{g_segment.title_origin.x}px;
			top:{g_segment.title_origin.y}px;
			color:{title_color};
			position:absolute;'>
		{g_segment.title}
	</div>
</Mouse_Responder>
