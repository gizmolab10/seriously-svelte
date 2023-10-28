<script>
	import { k, noop, Thing, Point, ZIndex, dbDispatch, Signals, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { onMount, onDestroy, graphEditor, Direction, FatTrianglePath } from "../../ts/common/GlobalImports";
	import { dotDiameter } from '../../ts/managers/State';
	export let thing;
	
	let triangle = new FatTrianglePath($dotDiameter + 2, Direction.left);
	let fillColor = k.backgroundColor;
	let path = triangle.path;
	let button = null;
	
	onMount( () => { updateState(false); });
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	const signalHandler = handleSignalOfKind(Signals.dots, (id) => { if (thing.id == id) { updatePath(); } });
	onDestroy( () => { signalHandler.disconnect(); });
	
	function updateState(isHovering) {
		updateColors(isHovering);
		updatePath();
	}

	function handleClick(event) {
		graphEditor.thing_redraw_remoteMoveRight(thing, !thing.isExpanded, true);
		updateState(false);
	}

	function updateColors(isHovering) {
		thing.updateColorAttributes();
		const buttonFlag = !thing.isExpanded || thing.isGrabbed;
		fillColor = thing.revealColor(buttonFlag != isHovering);
	}

	function updatePath() {
		const asTriangle = thing.hasChildren || thing.isBulkAlias;
		if (asTriangle) {
			const direction = thing.isExpanded ? Direction.left : Direction.right;
			triangle = new FatTrianglePath($dotDiameter + 2, direction);
			path = triangle.path;
		} else {
			path = null;
		}
	}

</script>

<button class='svg-button'
	bind:this={button}
	on:click={handleClick}
	style='
		top: 5px;
		left: {$dotDiameter + thing.titleWidth + 23}px;
	'>
	<svg width='16'
		height='16'
		viewbox='0 0 16 16'
		on:blur={noop()}
		on:focus={noop()}
		on:mouseout={handleMouseOut}
		on:mouseover={handleMouseOver}
		style='
			position: absolute;
			left: 0px;
			top: 0px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.svg-button {
		position: absolute;
		width: 16px;	 /* Match SVG viewbox width */
		height: 16px;	/* Match SVG viewbox height */
		cursor: pointer;
		background: none;
		border: none;
	}

	.svg-button svg {
	}

	.svg-button:hover {
			/* Styles for hover state, e.g., change SVG color */
	}

	.svg-button:active {
			/* Styles for active state */
	}

	.svg-button:focus {
			/* Styles for focus state, e.g., add an outline or change SVG color */
	}
</style>