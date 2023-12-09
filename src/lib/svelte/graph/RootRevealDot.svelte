<script>
	import { Point, debug, Direction, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import TriangleDot from '../kit/TriangleDot.svelte';
	import { dot_size } from '../../ts/managers/State';
	export let center = new Point();
	export let here;

	function newFillColor(isFilled) { return debug.lines ? 'transparent' : here.revealColor(isFilled); }

	function onClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.latestGrab(true);
		if (grab) {
			graphEditor.thing_redraw_remoteMoveRight(grab, false, false);
		}
	}

</script>

<TriangleDot
	newFillColor={newFillColor}
	direction={Direction.left}
	strokeColor={here.color}
	onClick={onClick}
    size={$dot_size}
	center={center}
	display='block'
/>
