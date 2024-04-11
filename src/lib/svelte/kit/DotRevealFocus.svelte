<script>
	import { g, k, Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../svg/TriangleButton.svelte';
	export let center = new Point();
    export let path;
	let size = k.dot_size;

	function fillColors_closure(isFilled) {
		return [debug.lines ? 'transparent' : path.dotColor(isFilled), k.empty];
	}

	function onClick(event) {
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
	onClick={onClick}
	id={path.thing.title}
	center={center}
    size={size}
/>
