<script>
	import { k, Size, ZIndex, Direction, svgPath } from "../../ts/common/GlobalImports";
	import SVGD3 from './SVGD3.svelte';
	export let strokeColor;
	export let position;
	export let size;
	const path = svgPath.triangle(Size.square(size), Direction.right);

</script>

<SVGD3
	path={path}
	position={position}
	fill={k.backgroundColor}
	stroke={strokeColor}
	zIndex={ZIndex.dots}
	size={Size.square(size)}
/>