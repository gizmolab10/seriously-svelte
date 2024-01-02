<script>
	import { k, Size, ZIndex, Direction, svgPath } from "../../ts/common/GlobalImports";
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.backgroundColor;
	export let extra = null;
	export let strokeColor;
	export let fillColor;
	export let position;
	export let size;
	const path = svgPath.triangle(Size.square(size), Direction.right);

</script>

<SVGD3
	path={path}
	fill={fillColor}
	position={position}
	stroke={strokeColor}
	zIndex={ZIndex.dots}
	size={Size.square(size)}
/>
{#if extra}
	<SVGD3
		path={extra}
		fill={extraColor}
		stroke={extraColor}
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
{/if}