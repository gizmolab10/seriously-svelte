<script lang='ts'>
	import { k, Arc_Map } from '../../ts/common/Global_Imports';
	export let viewBox = k.empty;
	export let arc_map: Arc_Map;
	export let color='red';

</script>

<svg class='svg-scroll-arc' viewBox={viewBox}>
	{#if arc_map.shown < 2}
		<path stroke={color} fill=transparent d={arc_map.single_svgPath}/>
	{:else}
		<path stroke={color} fill=transparent d={arc_map.arc_svgPath}/>
	{/if}
</svg>
