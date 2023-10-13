<script>
	import { noop, Thing, ZIndex, constants, dbDispatch, graphEditor, FatTrianglePath } from "../../ts/common/GlobalImports";
	import { idHere, dotDiameter } from '../../ts/managers/State';
	const triangle = new FatTrianglePath($dotDiameter + 2, 0);
	let fillColor = constants.backgroundColor;
	export let origin = new Point($dotDiameter, 20);
	const path = triangle.path;
	let button = null;
	export let here;
	
	$: { updateColors(true) }
	function mouseOver(event) { updateColors(true); }
	function mouseout(event) { updateColors(false); }

	function handleClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		if (grab) {
			graphEditor.thing_redraw_remoteMoveRight(grab, false, false);
		}
	}

	function updateColors(isFilled) {
		fillColor = here.revealColor(isFilled);
	}

</script>

<button class='svg-button'
	bind:this={button}
	on:click={handleClick}
	style='
		top: {origin.y - 6}px;
		left: {origin.x - 6}px;
	'>
	<svg width='20'
		height='20'
		viewbox='0 0 20 20'
		on:blur={noop()}
		on:focus={noop()}
		on:mouseout={mouseout}
		on:mouseover={mouseOver}
		style='position: absolute; left: 5px; top: 6px; z-index: {ZIndex.text};'>
		<path d={path} stroke={here.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.svg-button {
		position: absolute;
		border: none;
		background: none;
		border-radius: 50%;
		display: inline-block; /* or block */
		width: 30px;	 /* Match SVG viewbox width */
		height: 30px;	/* Match SVG viewbox height */
		cursor: pointer;
		outline: none; /* Optional: Remove focus outline, but only if you provide another focus style */
	}

	.svg-button svg {
		display: block; /* This removes any unwanted space below the SVG */
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