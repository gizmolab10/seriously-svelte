<script>
	import { editor, constants, dbDispatch, FatTrianglePath, Thing } from "../../ts/common/GlobalImports";
	import { idHere } from '../../ts/managers/State';
	const triangle = new FatTrianglePath(18, 0);
	let fillColor = constants.backgroundColor;
	export let origin = new Point(15, 20);
	const path = triangle.path;
	export let here = Thing;
	let fat = null;
	let border = here.grabAttributes;
	
	$: { updateColors(false); }
	function mouseOver(event) { updateColors(true); }
	function mouseout(event) { updateColors(false); }

	function handleClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		editor.thing_redraw_remoteMoveRight(grab, false, false);
	}

	function updateColors(isFilled) {
		fillColor = here.revealColor(isFilled);
		border = here.grabAttributes;
	}

</script>

<button class='svg-button'
	bind:this={fat}
	on:click={handleClick}
	style='border: {border}; left: {origin.x - 6}px; top: {origin.y - 6}px;'>
	<svg width='40'
		height='40'
		viewbox='0 0 40 40'
		on:mouseout={mouseout}
		on:mouseover={mouseOver}
		style='position: absolute; left: 5px; top: 5px;'>
		<path d={path} stroke={here.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.svg-button {
		position: absolute;
		background: none;
		padding: 0;
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