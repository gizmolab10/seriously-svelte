<script>
	import { k, u, Size, Thing, Point, ZIndex, svgPath, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import { s_dot_size, s_paths_grabbed } from '../../ts/managers/State';
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.backgroundColor;
	export let fillColor_closure;
	export let extra = null;
	export let strokeColor;
	export let direction;
	export let onClick;
	export let center;
	export let size;
	export let id;
	let scalablePath = svgPath.triangle(size, direction);
	let fillColor = k.backgroundColor;
	let button = null;

	function mouseOut(event) { setFillColor(false); }
	function mouseOver(event) { setFillColor(true); }
	function setFillColor(isFilled) { fillColor = fillColor_closure(isFilled); }
	
	$: {
		scalablePath = svgPath.triangle(size, direction);
		setFillColor(false);
	}

	$: {
		const _ = $s_paths_grabbed;
		setFillColor(false);
	}

</script>

<button id={id}
	on:blur={u.ignore}
	on:focus={u.ignore}
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
		size={size}
		fill={fillColor}
		stroke={strokeColor}
		scalablePath={scalablePath}
	/>
	{#if extra}
		<SVGD3
			size={size}
			fill={extraColor}
			stroke={extraColor}
			scalablePath={extra}
		/>
	{/if}
</button>
