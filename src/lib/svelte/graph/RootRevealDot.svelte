<script>
	import { Point, Direction, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import TriangleDot from '../kit/TriangleDot.svelte'
	import { dot_size } from '../../ts/managers/State';
	const size = 20;
	export let here;
	export let origin = new Point($dot_size, 20);

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
	display='block'
	origin={origin}
    size={size}
/>
