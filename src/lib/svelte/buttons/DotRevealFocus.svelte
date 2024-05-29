<script>
	import { k, Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../mouse buttons/TriangleButton.svelte';
	export let center = Point.zero;
    export let ancestry;
	let size = k.dot_size;

	function hover_closure(isFilled) {
		return [debug.lines ? 'transparent' : ancestry.dotColor(isFilled), k.empty];
	}

	function mouse_closure(mouseData) {
		if (!mouseData.isHover) {
			if (h.grabs.latestAncestryGrabbed(true)?.isFocus) {
				h.ancestry_rebuild_remoteMoveRight(ancestry, false, false);
			} else {
				ancestry.grabOnly();
			}
		}
	}

</script>

<TriangleButton
	strokeColor={ancestry.thing.color}
	hover_closure={hover_closure}
	direction={Direction.right}
	id={ancestry.thing.title}
	closure={mouse_closure}
	center={center}
    size={size}
/>
