<script>
	import { Point, debug, Direction, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import TriangleDot from '../kit/TriangleDot.svelte';
	import { dot_size } from '../../ts/managers/State';
	export let origin = new Point($dot_size, 20);
	export let here;
	let size = $dot_size;

	function newFillColor(isFilled) { return debug.lines ? 'transparent' : here.revealColor(isFilled); }

	function onClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.latestGrab(true);
		if (grab) {
			graphEditor.thing_redraw_remoteMoveRight(grab, false, false);
		}
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
		}
	}

</script>

<TriangleDot
	newFillColor={newFillColor}
	direction={Direction.left}
	strokeColor={here.color}
	onClick={onClick}
	origin={origin}
	display='block'
    size={size}
/>
