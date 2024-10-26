<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex, svgPaths, Oblong_Part, Segment_Map } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let stroke = 'black';
	export let fill = k.color_background;
	export let segment_map!: Segment_Map;
	export let hit_closure = (title) => {};
    export let name = `segment-for-${segment_map.title}`;
	let size = segment_map.size.expandedEquallyBy(2);
	let height = segment_map.height + 2;
	let center = segment_map.center;

	console.log(segment_map.description)

	function hover_andUp_closure(mouse_state) {
		if (mouse_state.isHover) {
			console.log('hover')
			const isHovering = !mouse_state.isOut;
			fill = isHovering ? 'black' : k.color_background;
			stroke = isHovering ? k.color_background : 'black';
		} else if (mouse_state.isUp) {
			hit_closure(segment_map.title);
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
			fill={fill}
			stroke={stroke}
			d={segment_map.path}/>
	</svg>
	<div
		class='title'
		style='
			top:1.5px;
			font-size: 0.95em;
			position:absolute'>
		{segment_map.title}
	</div>
</Mouse_Responder>
