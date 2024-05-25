<script>
	import { k, u, Size, Thing, Point, ZIndex, svgPaths, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import { s_ancestries_grabbed } from '../../ts/state/Stores';
	import Button from '../buttons/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let mouse_closure = (mouseData) => {};
	export let hover_closure = null;
	export let cursor = 'pointer';
	export let extraPath = null;
	export let name = k.empty;
	export let strokeColor;
	export let direction;
	export let center;
	export let size;
	let fillColor = k.color_background;
	let extraColor = k.color_background;
	let trianglePath = svgPaths.fat_polygon(size, direction);
	
	$: {
		trianglePath = svgPaths.fat_polygon(size, direction);
		setFillColor(false);
	}

	$: {
		const _ = $s_ancestries_grabbed;
		setFillColor(false);
	}

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}

	function closure(mouseData) {
		if (mouseData.isHover) {
			setFillColor(!mouseData.isOut);
		} else {
			mouse_closure(mouseData);
		}
	}

	// style='
	// 	display: block;;
	// 	background: none;
	// '
</script>

<Button
	closure={closure}
	center={center}
	cursor={cursor}
	name={name}
	height='20'
	width='20'>
	<SVGD3 name='triangle'
		svg_path={trianglePath}
		stroke={strokeColor}
		fill={fillColor}
		height={size}
		width={size}
	/>
	{#if extraPath}
		<SVGD3 name='triangleInside'
			svg_path={extraPath}
			stroke={extraColor}
			fill={extraColor}
			height={size}
			width={size}
		/>
	{/if}
</Button>
