<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex, svgPaths, Oblong_Part, Segment_Map } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let hit_closure = (title, shift) => {boolean};
	export let fill = k.color_background;
	export let segment_map!: Segment_Map;
    export let name = segment_map.title;
	export let stroke = k.color_default;
	let size = segment_map.size.expandedEquallyBy(2);
	let height = segment_map.height + 2;
	let center = segment_map.center;
	let title_color = k.color_default;
	let isHighlighted = false;
	let isHovering = false;

	// console.log(segment_map.description);

	function hover_andUp_closure(mouse_state) {
		const wasHighlighted = isHighlighted;
		if (mouse_state.isHover) {
			isHovering = !mouse_state.isOut;
		} else if (mouse_state.isDown) {
			isHighlighted = hit_closure(name, mouse_state.event.isShift);
		}
		title_color = isHovering | isHighlighted ? k.color_background : k.color_default;
		console.log(`${title_color} ${isHovering} ${wasHighlighted} ${isHighlighted} ${name}`)
		fill = isHovering && !wasHighlighted ? 'grey' : isHighlighted ? k.color_default : k.color_background;
	}

</script>

<Mouse_Responder
	name={name}
	center={center}
	cursor='pointer'
	width={size.width}
	height={size.height}
	zindex={ZIndex.frontmost}
	mouse_state_closure={hover_andUp_closure}>
	<svg
		class={name}
		viewBox={segment_map.viewBox}
		style='
			position: absolute;
			width:{size.width}px;
			height:{size.height}px;'>
		<path
			fill={fill}
			stroke={stroke}
			class='segment-path'
			d={segment_map.path}/>
	</svg>
	<div
		class='title'
		style='
			top:1.5px;
			font-size: 0.95em;
			position:absolute;
			color:{title_color};'>
		{segment_map.title}
	</div>
</Mouse_Responder>
