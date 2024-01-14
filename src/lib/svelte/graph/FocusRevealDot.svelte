<script>
	import { Point, debug, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import TriangleButton from '../svg/TriangleButton.svelte';
	import { dot_size } from '../../ts/managers/State';
    export let path = '';
	export let center = new Point();
	export let here;
	let size = $dot_size;

	function fillColor_closure(isFilled) {
		return debug.lines ? 'transparent' : here.revealColor(isFilled, path);
	}

	function onClick(event) {
		if (dbDispatch.db.hierarchy.grabs.latestPathGrabbed(true)?.isHere) {
			path.path_redraw_remoteMoveRight(false, false);
		} else {
			dbDispatch.db.hierarchy.grabs.grabOnly(path);
		}
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
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
