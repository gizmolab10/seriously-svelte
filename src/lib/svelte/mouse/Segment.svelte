<script lang='ts'>
	import { k, u, Rect, Size, Point, debug, ZIndex } from '../../ts/common/Global_Imports';
	import { svgPaths, Oblong_Part, Segment_Map } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let hit_closure = (title, shift) => {};
	export let fill = k.color_background;
	export let segment_map!: Segment_Map;
    export let name = segment_map.title;
	export let stroke = k.color_default;
	const segment_name = `${name}-${segment_map.name}-segment`;
	let title_color = k.color_default;
	let size = segment_map.size;
	let isHovering = false;

	update_colors();

	function update_colors() {
		title_color = isHovering ? k.color_background : k.color_default ;
		fill = isHovering ? k.color_default : segment_map.isSelected ? u.opacitize('skyblue', 0.6) : k.color_background;
		debug.log_segments(`${name} ${segment_map.isSelected ? 'selected' : ''} ${fill}`)
	}

	function up_hover_closure(mouse_state) {
		if (mouse_state.isHover) {
			isHovering = !mouse_state.isOut;
		} else if (mouse_state.isDown) {
			hit_closure(name, mouse_state.event.isShift);
		}
		update_colors();
	}

</script>

<Mouse_Responder
	cursor='pointer'
	width={size.width}
	name={segment_name}
	height={size.height}
	zindex={ZIndex.frontmost}
	center={segment_map.center}
	mouse_state_closure={up_hover_closure}>
	<svg
		class={`${segment_name}-svg`}
		viewBox={segment_map.viewBox}
		style='
			height:{size.height}px;
			width:{size.width}px;
			position: absolute;
			left:0px;'>
		<path
			class={`${segment_name}-path`}
			d={segment_map.path}
			stroke-width=0.3px
			stroke={stroke}
			fill={fill}/>
	</svg>
	<div
		class='title'
		style='
			left:{segment_map.title_origin.x}px;
			top:{segment_map.title_origin.y}px;
			color:{title_color};
			position:absolute;
			font-size:0.95em;'>
		{segment_map.title}
	</div>
</Mouse_Responder>
