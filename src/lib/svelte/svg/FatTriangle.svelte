<script>
	import { k, Size, ZIndex, Direction, svgPath } from "../../ts/common/GlobalImports";
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.backgroundColor;
	export let extra = null;
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
	zIndex={ZIndex.dots}
	scalablePath={scalablePath}
/>
{#if extra}
	<SVGD3
		size={size}
		fill={extraColor}
		stroke={extraColor}
		scalablePath={extra}
		zIndex={ZIndex.dots}
	/>
{/if}