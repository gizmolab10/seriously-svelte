<script>
	import { k, Size, Thing, Point, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dot_size } from '../../ts/managers/State';
	export let newFillColor;
	export let strokeColor;
	export let direction;
	export let onClick;
	export let display;
	export let origin;
	export let size;
	const path = svgPath.triangle(Size.square(size), direction);
	let fillColor = k.backgroundColor;
	let button = null;
	
	$: {
		size = size + 1;
		updateColors(false);
		size = size - 1;
	}
	function mouseOut(event) { updateColors(false); }
	function mouseOver(event) { updateColors(true); }
	function updateColors(isFilled) { fillColor = newFillColor(isFilled); }

</script>

{#key display}
	<button class='svg-button'
		bind:this={button}
		on:click={onClick}
		style='
			display: {display};
			top: {origin.y - 6}px;
			left: {origin.x - 6}px;
		'>
		<svg class='svg'
			width={size}
			height={size}
			on:mouseout={mouseOut}
			on:mouseover={mouseOver}
			viewbox='0 0 {size} {size}'
			style='z-index: {ZIndex.dots};'>
			<path d={path} stroke={strokeColor} fill={fillColor}/>
		</svg>
	</button>
{/key}

<style>
	.svg {
		position: absolute;
		left: 5px; top: 6px;
	}
	.svg-button {
		width: 20px;
		height: 20px;
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
		border-radius: 50%;
	}
	.svg-button svg {
		display: block; /* This removes any unwanted space below the SVG */
	}
	.svg-button:hover {}
	.svg-button:active {}
	
</style>