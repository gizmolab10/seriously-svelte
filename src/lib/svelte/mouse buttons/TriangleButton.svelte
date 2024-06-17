<script lang='ts'>
	import { k, u, Size, Thing, Point, ZIndex, svgPaths, ElementState, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_ancestries_grabbed } from '../../ts/state/ReactiveState';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Button from './Button.svelte';
	export let mouse_closure = (mouseState) => {};
	export let hover_closure = (isHovering) => {};
	export let elementState = ElementState.none;
	export let extraPath = null;
	export let name = k.empty;
	export let strokeColor;
	export let center;
	export let angle;
	export let size;
	let fillColor = k.color_background;
	let extraColor = k.color_background;
	let trianglePath = svgPaths.fat_polygon(size, angle);
	
	$: {
		trianglePath = svgPaths.fat_polygon(size, angle);
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

	function closure(mouseState) {
		if (mouseState.isHover) {
			setFillColor(!mouseState.isOut);
		} else {
			mouse_closure(mouseState);
		}
	}

</script>

<Button
	elementState={elementState}
	border_thickness=0
	closure={closure}
	center={center}
	height={size}
	width={size}
	name={name}>
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
	<slot></slot>
</Button>
