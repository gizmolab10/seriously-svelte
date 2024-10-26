<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex, svgPaths, Oblong_Part, Segment_Map } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let hit_closure = (title) => {boolean};
	export let fill = k.color_background;
	export let segment_map!: Segment_Map;
    export let name = segment_map.title;
	export let stroke = 'black';
	let size = segment_map.size.expandedEquallyBy(2);
	let height = segment_map.height + 2;
	let center = segment_map.center;
	let isHighlighted = false;
	let isHovering = false;

	// console.log(segment_map.description);

	function hover_andUp_closure(mouse_state) {
		if (mouse_state.isHover) {
			stroke = 'black';
			console.log('hover')
			isHovering = !mouse_state.isOut;
			fill = isHighlighted ? 'black' : isHovering ? 'grey' : k.color_background;
		} else if (mouse_state.isDown) {
			isHighlighted = hit_closure(name);
		}
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
			class='segment-path'
			fill={fill}
			stroke={stroke}
			d={segment_map.path}/>
	</svg>
	<div
		class='title'
		style='
			top:1.5px;
			color:{isHovering | isHighlighted ? 'white' : 'black'};
			font-size: 0.95em;
			position:absolute'>
		{segment_map.title}
	</div>
</Mouse_Responder>
