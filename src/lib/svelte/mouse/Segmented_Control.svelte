<script lang='ts'>
	import { k, Rect, Size, Point, ZIndex, svgPaths } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let selection_closure = (mouse_state, selectionArray) => {};
	export let titles: Array<string> = [];
    export let name = 'segmented control';
	export let fill = k.color_background;
	export let height = k.row_height;
	export let center = Point.zero;
	export let stroke = 'black';
	export let multiple = false;
	let selected_indices: Array<Int> = [];
	let outer_size = Size.zero;
	let path = k.empty;

	update_path();

	function update_path() {
		const width = 200;
		size = new Size(width, height);
		outer_size = size.expandedEquallyBy(2);
		path = svgPaths.oblong(oblong_center, size.expandedByX(-22));
	}

	function hover_andUp_closure(mouse_state) {
		if (mouse_state.isHover) {
			console.log('hover')
			const isHovering = !mouse_state.isOut;
			fill = isHovering ? 'black' : k.color_background;
			stroke = isHovering ? k.color_background : 'black';
		} else if (mouse_state.isUp) {
			console.log('up')
		}
	}

</script>

<Mouse_Responder
	name={name}
	cursor='pointer'
	center={rect.center}
	width={outer_size.width}
	zindex={ZIndex.frontmost}
	height={outer_size.height}
	mouse_state_closure={hover_up_closure}>
	<svg
		viewBox={rect.expandedBy(4).verbose}
		style='
			position: absolute;
			width:{outer_size.width}px;
			height:{outer_size.height}px;'>
		<path
			fill=transparent
			stroke='black'
			d={path}/>
	</svg>
	<div class='items' style='top:4px;'>
		{#each items as item}
			&nbsp;{item}&nbsp;
		{/each}
	</div>
	<div class='vertical-line'
		style='
			top: 2px;
			width: 1px;
			position: absolute;
			background-color: black;
			left: 50px;
			z-index: {ZIndex.frontmost};
			height: {size.height}px;'>
	</div>
</Mouse_Responder>
