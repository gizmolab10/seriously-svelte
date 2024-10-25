<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex, svgPaths, Oblong_Part } from '../../ts/common/Global_Imports';
	import { s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let selection_closure = (mouse_state, selectionArray) => {};
	export let titles: Array<string> = [];
    export let name = 'segmented-control';
	export let fill = k.color_background;
	export let height = k.row_height - 1;
	export let origin = Point.zero;
	export let stroke = 'black';
	export let multiple = false;
	let selected_indices: Array<number> = [];
	let title_widths: Array<number> = [];
	let control_center = Point.zero;
	let control_size = Size.zero;
	let viewBox = k.empty;
	let path = k.empty;

	update_path();

	function update_path() {
		const width = update_title_widths();
		const size = new Size(width, height);
		const path_size = size.expandedByX(-20);
		control_size = size.expandedEquallyBy(2);
		const viewBox_origin = origin.offsetByY(-0.5);
		viewBox = new Rect(viewBox_origin, control_size).viewBox;
		control_center = size.dividedInHalf.asPoint.offsetBy(origin);
		path = svgPaths.oblong(control_center, path_size, Oblong_Part.full);
	}

	function update_title_widths(): number {
		let total = 0;
		for (const title of titles) {
			total += u.getWidthOf(title) + 20;
		}
		return total;
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

<div class='segmented-wrapper'
	style='
		top: -1px;
		position: absolute;'>
	<Mouse_Responder
		name={name}
		cursor='pointer'
		center={control_center}
		zindex={ZIndex.frontmost}
		width={control_size.width}
		height={control_size.height}
		mouse_state_closure={hover_andUp_closure}>
		<svg
			viewBox={viewBox}
			style='
				position: absolute;
				width:{control_size.width}px;
				height:{control_size.height}px;'>
			<path
				fill=transparent
				stroke='black'
				d={path}/>
		</svg>
		<div class='segments'>
			{#each titles as title}
				&nbsp;&nbsp;&nbsp;{title}&nbsp;&nbsp;
			{/each}
		</div>
		<div class='vertical-line'
			style='
				top: 0px;
				width: 1px;
				left: 41.3px;
				position: absolute;
				background-color: black;
				z-index: {ZIndex.frontmost};
				height: {height}px;'>
		</div>
	</Mouse_Responder>
</div>
