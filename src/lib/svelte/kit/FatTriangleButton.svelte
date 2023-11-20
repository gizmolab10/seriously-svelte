<script>
	import { Point, Direction, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import { dotSize } from '../../ts/managers/State';
	import TriangleDot from './TriangleDot.svelte'
	export let origin = new Point($dotSize, 20);
	export let here;

	function newFillColor(isFilled) { return here.revealColor(isFilled); }

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
	origin={origin}
/>
