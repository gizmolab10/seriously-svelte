<script>
	import { k, Point, debug, Direction, dbDispatch, graphEditor, Relationship } from "../../ts/common/GlobalImports";
	import TriangleButton from '../svg/TriangleButton.svelte';
	import { dot_size } from '../../ts/managers/State';
	export let center = new Point();
	export let relationship;
	let size = $dot_size;

	function fillColor_closure(isFilled) {
		return debug.lines ? 'transparent' : relationship.revealColor(isFilled);
	}

	function onClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.latestGrab(true);
		if (grab && grab.id == relationship.id) {
			graphEditor.relationship_toThing_redraw_remoteMoveRight(grab, false, false);
		} else {
			relationship.grabOnly();
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
	strokeColor={relationship.toThing?.color ?? k.defaultColor}
	onClick={onClick}
	id={relationship.title}
	center={center}
    size={size}
/>
