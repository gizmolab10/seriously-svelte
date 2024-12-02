<script lang='ts'>
	import { k, u, Size, Thing, Point, ZIndex, svgPaths } from '../../ts/common/Global_Imports';
	import { dbDispatch, Mouse_State, Element_State } from '../../ts/common/Global_Imports';
	import { s_grabbed_ancestries } from '../../ts/state/Svelte_Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Button from './Button.svelte';
	export let handle_mouse_state = Handle_Result<Mouse_State>;
	export let hover_closure = Handle_Result<boolean>;
	export let element_state = Element_State.none;
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
		const _ = $s_grabbed_ancestries;
		setFillColor(false);
	}

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}

	function closure(mouse_state) {
		if (mouse_state.isHover) {
			setFillColor(!mouse_state.isOut);
		} else {
			handle_mouse_state(mouse_state);
		}
	}

</script>

<Button
	element_state={element_state}
	border_thickness=0
	closure={closure}
	center={center}
	height={size}
	width={size}
	name={name}>
	<SVGD3 name='triangle'
		svgPath={trianglePath}
		stroke={strokeColor}
		fill={fillColor}
		height={size}
		width={size}
	/>
	{#if extraPath}
		<SVGD3 name='triangleInside'
			svgPath={extraPath}
			stroke={extraColor}
			fill={extraColor}
			height={size}
			width={size}
		/>
	{/if}
	<slot></slot>
</Button>
