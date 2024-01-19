<script>
	import { Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../svg/TriangleButton.svelte';
	import { s_dot_size } from '../../ts/managers/State';
    export let path = '';
	export let center = new Point();
	export let here;
	let size = $s_dot_size;

	function fillColor_closure(isFilled) {
		return debug.lines ? 'transparent' : here.revealColor(isFilled, path);
	}

	function onClick(event) {
		if (dbDispatch.db.hierarchy.grabs.latestPathGrabbed(true)?.isHere) {
			dbDispatch.db.hierarchy.path_rebuild_remoteMoveRight(path, false, false);
		} else {
			path.grabOnly();
		}
	}

	$: {
		if ($s_dot_size > 0) {
			size = $s_dot_size;
		}
	}

</script>

<TriangleButton
	fillColor_closure={fillColor_closure}
	direction={Direction.left}
	strokeColor={here.color}
	onClick={onClick}
	id={here.title}
	center={center}
    size={size}
/>
