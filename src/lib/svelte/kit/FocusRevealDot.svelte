<script>
	import { g, k, Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../svg/TriangleButton.svelte';
	export let center = new Point();
    export let path = '';
	export let here;
	let size = k.dot_size;

	function fillColors_closure(isFilled) {
		return [debug.lines ? 'transparent' : path.dotColor(isFilled), ''];
	}

	function onClick(event) {
		if (g.hierarchy.grabs.latestPathGrabbed(true)?.isHere) {
			g.hierarchy.path_rebuild_remoteMoveRight(path, false, false);
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
	strokeColor={here.color}
	onClick={onClick}
	id={here.title}
	center={center}
    size={size}
/>
