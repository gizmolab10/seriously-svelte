<script lang='ts'>
	import { e, k, s, hits, colors, svgPaths, elements } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let align_left: boolean = false;
	export let stroke_width: number = 0.75;
    export let name = 'generic close';
	export let closure: () => void;
	export let origin: Point;
    export let size = 20;
	const { w_s_hover } = hits;
	const { w_count_mouse_up } = e;
	const s_element = elements.s_element_for(new Identifiable(name), T_Hit_Target.button, name);
	let mouse_up_count = $w_count_mouse_up;
	let element: HTMLElement | null = null;
	let stroke = colors.default;
	let fill = 'white';

	$: {
		const _ = $w_s_hover;
		const isHovering = $w_s_hover?.id === s_element.id;
		stroke = isHovering ? 'white' : colors.default;
		fill = isHovering ? 'gray' : 'white';
	}

	onMount(() => {
		if (!!element) {
			s_element.set_html_element(element);
		}
		return () => {
			hits.delete_hit_target(s_element);
		};
	});

	$: if (mouse_up_count != $w_count_mouse_up) {
		mouse_up_count = $w_count_mouse_up;
		if ($w_s_hover?.id === s_element.id) {
			closure();
		}
	}

	$: style = `
		position: absolute;
		cursor: pointer;
		z-index: ${T_Layer.dot};
		width: ${size}px;
		height: ${size}px;
		${align_left ? 'left' : 'right'}: ${origin.x}px;
		top: ${origin.y}px;
	`.removeWhiteSpace();

</script>

<div class='close-button'
	bind:this={element}
	style={style}>
    <SVG_D3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={colors.default}
		stroke_width={stroke_width}
		svgPath={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVG_D3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		stroke_width={1}
		svgPath={svgPaths.x_cross(size, size / 6)}
	/>
</div>
