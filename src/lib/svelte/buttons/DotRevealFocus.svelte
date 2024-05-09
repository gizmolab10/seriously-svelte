<script>
	import { k, Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../buttons/TriangleButton.svelte';
	export let center = new Point();
    export let ancestry;
	let size = k.dot_size;

	function hover_closure(isFilled) {
		return [debug.lines ? 'transparent' : ancestry.dotColor(isFilled), k.empty];
	}

	function click_closure(event, isLong) {
		if (h.grabs.latestAncestryGrabbed(true)?.isFocus) {
			h.ancestry_rebuild_remoteMoveRight(ancestry, false, false);
		} else {
			ancestry.grabOnly();
		}
	}

	$: {
		if (k.dot_size > 0) {
			size = k.dot_size;
		}
	}

</script>

<TriangleButton
	strokeColor={ancestry.thing.color}
	hover_closure={hover_closure}
	click_closure={click_closure}
	direction={Direction.right}
	id={ancestry.thing.title}
	center={center}
    size={size}
/>
