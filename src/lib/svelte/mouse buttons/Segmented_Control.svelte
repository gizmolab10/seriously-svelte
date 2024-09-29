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
	let fill = k.color_background;
	const oblong_center = new Point(rect.origin.x, 10);
	const size = rect.size;

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
	width={size.width}
	height={size.height}
	center={rect.center}
	zindex={ZIndex.frontmost};
	mouse_state_closure={mouse_closure}>
	<svg
		style='
			position: absolute;
			width:{size.width}px;
			height:{size.height}px;'>
		<path
			fill='white'
			stroke='black'
			d={svgPaths.oblong(oblong_center, size)}/>
	</svg>
	{items[0]}
</Mouse_Responder>
