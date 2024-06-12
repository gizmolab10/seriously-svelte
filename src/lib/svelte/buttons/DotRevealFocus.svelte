<script lang='ts'>
	import { k, Point, debug, onMount, Direction, dbDispatch } from '../../ts/common/GlobalImports';
	import TriangleButton from '../mouse buttons/TriangleButton.svelte';
	export let center = Point.zero;
    export let ancestry;
	const elementState = s.elementState_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;

	onMount(() => {
		elementState.set_forHovering(ancestry.thing.color, 'pointer');
	})

	function hover_closure(isFilled) {
		return [debug.lines ? 'transparent' : elementState.stroke, k.empty];
	}

	function mouse_closure(mouseState) {
		if (mouseState.isHover) {
			elementState.isOut = mouseState.isOut;
		} else {
			if (h.grabs.latestAncestryGrabbed(true)?.isFocus) {
				h.ancestry_rebuild_remoteMoveRight(ancestry, false, false);
			} else {
				ancestry.grabOnly();
			}
		}
	}

</script>

<TriangleButton
	strokeColor={elementState.stroke}
	hover_closure={hover_closure}
	direction={Direction.right}
	id={ancestry.thing.title}
	closure={mouse_closure}
	center={center}
    size={size}
/>
