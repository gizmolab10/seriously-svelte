<script>
	import { g, k, Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../buttons/TriangleButton.svelte';
	export let center = new Point();
    export let path;
	let size = k.dot_size;

	function fillColors_closure(isFilled) {
		return [debug.lines ? 'transparent' : path.dotColor(isFilled), k.empty];
	}

	function click_closure(event, isLong) {
		const h = g.hierarchy;
		if (h.grabs.latestPathGrabbed(true)?.isFocus) {
			h.path_rebuild_remoteMoveRight(path, false, false);
		} else {
			path.grabOnly();
		}
	}

	$: {
		if (k.dot_size > 0) {
			size = k.dot_size;
		}
	}

</script>

<TriangleButton
	fillColors_closure={fillColors_closure}
	direction={Direction.right}
	strokeColor={path.thing.color}
	click_closure={click_closure}
	id={path.thing.title}
	center={center}
    size={size}
/>
