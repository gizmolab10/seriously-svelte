<script>
	import { k, Size, Point, ZIndex, svgPath, Direction } from "../../ts/common/GlobalImports";
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.color_background;
	export let extraPath = null;
	export let strokeColor;
	export let fillColor;
	export let position;
	export let size;
	const scalablePath = svgPath.triangle(size, Direction.right);

</script>

<SVGD3
	size={size}
	fill={fillColor}
	position={position}
	stroke={strokeColor}
	scalablePath={scalablePath}
/>
{#if extraPath}
	<SVGD3
		size={size}
		fill={extraColor}
		stroke={extraColor}
		scalablePath={extraPath}
		x={size / 4}
	/>
{/if}