<script>
	import { k, noop, Size, Thing, Point, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dotSize } from '../../ts/managers/State';
	export let direction = 0;
	export let origin = new Point($dotSize, 20);
	export let newFillColor;
	export let strokeColor;
	export let onClick;
	const path = svgPath.triangle(Size.square($dotSize), direction);
	let fillColor = k.backgroundColor;
	let button = null;
	
	$: { updateColors(false) }
	function mouseOver(event) { updateColors(true); }
	function mouseout(event) { updateColors(false); }
	function updateColors(isFilled) { fillColor = newFillColor(isFilled); }

</script>

<button class='svg-button'
	bind:this={button}
	on:click={onClick}
	style='
		top: {origin.y - 6}px;
		left: {origin.x - 6}px;
	'>
	<svg width='20'
		height='20'
		on:blur={() => { noop(); }}
		on:focus={() => { noop(); }}
		viewbox='0 0 20 20'
		on:mouseout={mouseout}
		on:mouseover={mouseOver}
		style='position: absolute; left: 5px; top: 6px; z-index: {ZIndex.dots};'>
		<path d={path} stroke={strokeColor} fill={fillColor}/>
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