<script>
	import { Point, debug, Direction, dbDispatch, graphEditor } from "../../../ts/common/GlobalImports";
	import TriangleButton from '../../svg/TriangleButton.svelte';
	import { dot_size } from '../../../ts/managers/State';
	export let center = new Point();
	export let here;
	let size = $dot_size;

	function fillColor_closure(isFilled) {
		return debug.lines ? 'transparent' : here.revealColor(isFilled);
	}

	function onClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.latestGrab(true);
		if (grab && grab.id == here.id) {
			graphEditor.thing_redraw_remoteMoveRight(grab, false, false);
		} else {
			here.grabOnly();
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
