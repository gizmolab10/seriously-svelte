<script>
	import { k, Size, Thing, Point, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dot_size } from '../../ts/managers/State';
	export let newFillColor;
	export let strokeColor;
	export let direction;
	export let onClick;
	export let display;
	export let center;
	export let size;
	export let id;
	let path = svgPath.triangle(Size.square(size), direction);
	let fillColor = k.backgroundColor;
	let button = null;
	
	$: {
		path = svgPath.triangle(Size.square(size), direction);
		updateColors(false);
	}
	function mouseOut(event) { updateColors(false); }
	function mouseOver(event) { updateColors(true); }
	function updateColors(isFilled) { fillColor = newFillColor(isFilled); }

</script>

{#key display}
	<button id={id}
		bind:this={button}
		on:click={onClick}
		style='
			width: 20px;
			height: 20px;
			border: none;
			display: block;
			cursor: pointer;
			background: none;
			position: absolute;
			border-radius: 50%;
			top: {center.y + 2 - (size / 2)}px;
			left: {center.x + 3 - (size / 2)}px;
		'>
		<svg
			width={size}
			height={size}
			on:mouseout={mouseOut}
			on:mouseover={mouseOver}
			viewbox='0 0 {size} {size}'
			style='
				position: absolute;
				left: 5px; top: 6px;
				z-index: {ZIndex.dots};'>
			<path d={path} stroke={strokeColor} fill={fillColor}/>
		</svg>
	</button>
{/key}
