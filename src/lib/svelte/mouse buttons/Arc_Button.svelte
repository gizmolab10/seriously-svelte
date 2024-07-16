<script lang='ts'>
	import { Arc_Map } from '../../ts/common/Global_Imports';
	export let arc_map: Arc_Map;
	export let color='red';
	export let breadth=0;
	export let offset=0;

</script>

<svg class='svg-scroll-arc' 
	viewBox='{-offset} {-offset} {breadth} {breadth}'>
	{#if arc_map.shown < 2}
		<path stroke={color} fill=transparent d={arc_map.single_svgPath}/>
	{:else}
		{#each arc_map.main_svgPaths as mainPath}
			<path stroke={color} fill=transparent d={mainPath}/>
		{/each}
		{#each arc_map.outer_svgPaths as outerPath}
			<path stroke={color} fill=transparent d={outerPath}/>
		{/each}
	{/if}
</svg>