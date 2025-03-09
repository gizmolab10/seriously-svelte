<script lang='ts'>
	import { k, u, Size, Thing, Point, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { T_Layer, S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed } from '../../ts/common/Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Button from './Button.svelte';
	export let handle_mouse_state = Handle_Result<S_Mouse>;
	export let hover_closure = Handle_Result<boolean>;
	export let s_element = S_Element.none;
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
		const _ = $w_ancestries_grabbed;
		setFillColor(false);
	}

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}

	function closure(s_mouse) {
		if (s_mouse.isHover) {
			setFillColor(!s_mouse.isOut);
		} else {
			handle_mouse_state(s_mouse);
		}
	}

</script>

<Button
	s_element={s_element}
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
