<script>
	import { k, u, Size, Thing, Point, ZIndex, svgPaths, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import { s_ancestries_grabbed } from '../../ts/state/State';
	import Button from '../buttons/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let hover_closure = null;
	export let cursor = 'pointer';
	export let extraPath = null;
	export let mouse_click_closure;
	export let strokeColor;
	export let direction;
	export let center;
	export let size;
	export let id;
	let fillColor = k.color_background;
	let extraColor = k.color_background;
	let scalablePath = svgPaths.fat_polygon(size, direction);

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}
	
	$: {
		scalablePath = svgPaths.fat_polygon(size, direction);
		setFillColor(false);
	}

	$: {
		const _ = $s_ancestries_grabbed;
		setFillColor(false);
	}

	// style='
	// 	display: block;;
	// 	background: none;
	// '
</script>

<Button
	hover_closure={(isHovering) => { setFillColor(isHovering); }}
	center={center.offsetBy(new Point(3, 2))}
	mouse_click_closure={mouse_click_closure}
	cursor={cursor}
	height='20'
	width='20'>
	<SVGD3 name='triangle'
		stroke={strokeColor}
		scalablePath={scalablePath}
		fill={fillColor}
		height={size}
		width={size}
	/>
	{#if extraPath}
		<SVGD3 name='triangleInside'
			stroke={extraColor}
			scalablePath={extraPath}
			fill={extraColor}
			height={size}
			width={size}
		/>
	{/if}
</Button>
