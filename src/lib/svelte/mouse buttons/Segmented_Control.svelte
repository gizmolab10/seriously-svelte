<script lang='ts'>
	import { k, Rect, svgPaths } from '../../ts/common/Global_Imports';
    import { s_id_popupView } from '../../ts/state/Reactive_State';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let titles: Array<string> = [];
    export let name = 'segmented control';
    export let rect = Rect.zero;
	export let stroke = 'black';
	let fill = k.color_background;
	let size = rect.size;

	function closure(mouse_state) {
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
	mouse_state_closure={closure}>
</Mouse_Responder>
