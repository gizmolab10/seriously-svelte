<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, Size, Thing, Point, svgPaths, databases } from '../ts/common/Global_Imports';
	import { w_background_color, w_ancestries_grabbed } from '../ts/common/Stores';
	import { T_Layer, S_Mouse, S_Element } from '../ts/common/Global_Imports';
	import type { Handle_Result } from '../ts/common/Types';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Button from './Button.svelte';
	interface Props {
		handle_mouse_state?: any;
		hover_closure?: any;
		es_triangle?: any;
		extraPath?: any;
		name?: any;
		strokeColor: any;
		center: any;
		angle: any;
		size: any;
		children?: import('svelte').Snippet;
	}

	let {
		handle_mouse_state = Handle_Result<S_Mouse>,
		hover_closure = Handle_Result<boolean>,
		es_triangle = S_Element.empty(),
		extraPath = null,
		name = k.empty,
		strokeColor,
		center,
		angle,
		size,
		children
	}: Props = $props();
	let fillColor = $state($w_background_color);
	let extraColor = $state($w_background_color);
	let trianglePath = $state(svgPaths.fat_polygon(size, angle));
	


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

	run(() => {
		trianglePath = svgPaths.fat_polygon(size, angle);
		setFillColor(false);
	});
	run(() => {
		const _ = $w_ancestries_grabbed;
		setFillColor(false);
	});
</script>

<Button
	es_button={es_triangle}
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
	{@render children?.()}
</Button>
