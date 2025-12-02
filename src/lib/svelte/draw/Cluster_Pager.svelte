<script lang='ts'>
	import { k, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { Point, T_Hit_Target } from '../../ts/common/Global_Imports';
	export let thumbTransform = k.empty;
	export let thumb_path_d = k.empty;
	export let size = k.height.dot;
	export let center = Point.zero;
	export let direction = k.empty;
	export let viewBox = k.empty;
	export let name = k.empty;
	export let color = 'red';
	const s_pager = elements.s_element_forName_andType(name, T_Hit_Target.paging, direction);
	let pager: HTMLElement | null = null;

	$: {
		if (pager) {
			s_pager.set_html_element(pager);
			s_pager.set_forHovering(color, 'pointer');
		}
	}

</script>

<svg class='svg-pager'
	style='
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;'>
	bind:this={pager}
	viewBox={viewBox}>
	<path class={name}
		stroke={color}
		fill='transparent'
		transform={thumbTransform}
		d={svgPaths.fat_polygon(size, 0, 3, true)}/>
</svg>