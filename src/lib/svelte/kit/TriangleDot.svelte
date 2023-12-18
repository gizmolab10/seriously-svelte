<script>
	import { k, Size, Thing, Point, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed } from '../../ts/managers/State';
	import SVGD3 from './SVGD3.svelte';
	export let fillColor_closure;
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

	function mouseOut(event) { setFillColor(false); }
	function mouseOver(event) { setFillColor(true); }
	function setFillColor(isFilled) { fillColor = fillColor_closure(isFilled); }
	
	$: {
		path = svgPath.triangle(Size.square(size), direction);
		setFillColor(false);
	}

	$: {
		const _ = $ids_grabbed;
		setFillColor(false);
	}

</script>

{#key display}
	<button id={id}
		bind:this={button}
		on:click={onClick}
		on:mouseout={mouseOut}
		on:mouseover={mouseOver}
		style='
			width: 20px;
			height: 20px;
			border: none;
			display: block;
			cursor: pointer;
			background: none;
			position: absolute;
			top: {center.y + 2 - (size / 2)}px;
			left: {center.x + 3 - (size / 2)}px;
		'>
		<SVGD3
			path={path}
			fill={fillColor}
			stroke={strokeColor}
			zIndex={ZIndex.dots}
			size={new Size(size, size)}
		/>
	</button>
{/key}
