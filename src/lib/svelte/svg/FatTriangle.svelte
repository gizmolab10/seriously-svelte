<script>
	import { k, Size, Point, ZIndex, svgPath, Direction } from "../../ts/common/GlobalImports";
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.color_background;
	export let extraPath = null;
	export let strokeColor;
	export let fillColor;
	export let position;
	export let size;
	const scalablePath = svgPath.fatTriangle(size, Direction.left);

</script>

<SVGD3
	width={size}
	height={size}
	fill={fillColor}
	position={position}
	stroke={strokeColor}
	scalablePath={scalablePath}
/>
{#if extraPath}
	<SVGD3
		width={size}
		height={size}
		fill={extraColor}
		stroke={extraColor}
		scalablePath={extraPath}
		x={size / 4}
	/>
{/if}