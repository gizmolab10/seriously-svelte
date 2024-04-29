<script lang='ts'>
	import { k, Point, ZIndex, ClusterLayout } from '../../ts/common/GlobalImports';
	export let layout: ClusterLayout;
	export let center = Point.zero;
	export let color = 'red';
	const radius = k.necklace_radius;
	const diameter = radius * 2;
	let arcCenter = Point.square(radius);
	let arcPath = k.empty;
	let rebuilds = 0;

</script>

{#key rebuilds}
	<svg class='cluster-arc' 
    viewBox='0 0 {diameter} {diameter}'
	style='
		position: absolute;
		width: {diameter}px;
		height: {diameter}px;
		zindex: {ZIndex.frontmost};
		top: {center.y - radius}px;
		left: {center.x - radius}px;'>
		<path stroke={color} fill={k.color_background} d={layout.arcPath}/>
	</svg>
{/key}
