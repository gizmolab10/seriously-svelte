<script lang='ts'>
	import { k, Point, debug, onMount, Direction, dbDispatch } from '../../ts/common/Global_Imports';
	import Triangle_Button from '../mouse buttons/Triangle_Button.svelte';
	export let center = Point.zero;
    export let ancestry;
	const element_state = ux.elementState_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;

	element_state.set_forHovering(ancestry.thing.color, 'pointer');

	function hover_closure(isHovering) {
		return [debug.lines ? 'transparent' : element_state.stroke, k.empty];
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else {
			if (h.grabs.latestAncestryGrabbed(true)?.isFocus) {
				h.ancestry_rebuild_remoteMoveRight(ancestry, false, false);
			} else {
				ancestry.grabOnly();
			}
		}
	}

</script>

<Triangle_Button
	strokeColor={element_state.stroke}
	hover_closure={hover_closure}
	closure={handle_mouse_state}
	id={ancestry.thing.title}
	angle={Direction.right}
	center={center}
    size={size}
/>
