<script lang='ts'>
	import { k, Rect, Point, ZIndex, svgPaths } from '../../ts/common/Global_Imports';
    import { s_id_popupView } from '../../ts/state/Reactive_State';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let control_closure = (id, mouse_state) => {};
    export let name = 'segmented control';
	export let items: Array<Any> = [];
    export let rect = Rect.zero;
	export let stroke = 'black';
	const size = rect.size;
	const outer_size = size.expandedEquallyBy(2);
	const oblong_center = new Point(rect.origin.x -8, 11);
	let path = svgPaths.oblong(oblong_center, size.expandedByX(-22));
	let fill = k.color_background;

	function mouse_closure(mouse_state) {
		if (mouse_state.isHover) {
			const isHovering = !mouse_state.isOut;
			fill = isHovering ? 'black' : k.color_background;
			stroke = isHovering ? k.color_background : 'black';
		} else if (mouse_state.isUp) {
			$s_id_popupView = null;
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
	mouse_state_closure={mouse_closure}>
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
