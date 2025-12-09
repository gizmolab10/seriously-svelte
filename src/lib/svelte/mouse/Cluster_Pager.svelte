<script lang='ts'>
	import { k, hits, elements, svgPaths, colors } from '../../ts/common/Global_Imports';
	import { Point, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { onMount, onDestroy } from 'svelte';
	export let handle_click: () => void = () => {};
	export let thumbTransform = k.empty;
	export let thumb_path_d = k.empty;
	export let size = k.height.dot;
	export let center = Point.zero;
	export let direction = k.empty;
	export let viewBox = k.empty;
	export let name = k.empty;
	export let color = 'red';
	const { w_s_hover } = hits;
	const { w_background_color } = colors;
	const s_pager = elements.s_element_forName_andType(name, T_Hit_Target.paging, direction);
	let pager: SVGGElement | null = null;
	let fill_color = 'transparent';

	s_pager.set_forHovering(color, 'pointer');

	onMount(() => {
		if (pager) {
			s_pager.set_html_element(pager);
		}
	});

	onDestroy(() => {
		hits.delete_hit_target(s_pager);
	});

	$: {
		const _ = `${$w_s_hover?.id ?? 'null'}:::${$w_background_color}`;
		update_colors();
	}

	function update_colors() {
		fill_color = s_pager.isHovering ? s_pager.hoverColor : 'transparent';
	}

	function handle_pointerup(event: PointerEvent) {
		handle_click();
	}

</script>

<g class='pager-group {name}'
	bind:this={pager}
	transform={thumbTransform}
	on:pointerup={handle_pointerup}
	style='cursor: pointer; pointer-events: auto;'>
	<path class={name}
		stroke={color}
		fill={fill_color}
		pointer-events="all"
		d={svgPaths.fat_polygon(size, 0, 3, true)}/>
</g>