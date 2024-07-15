<script lang='ts'>
	import { Arc_Path } from '../../ts/common/Global_Imports';
	export let arc_path: Arc_Path;
	export let color='red';
	export let breadth=0;
	export let offset=0;

</script>

<svg class='svg-scroll-arc' 
	viewBox='{-offset} {-offset} {breadth} {breadth}'>
	{#if arc_path.shown < 2}
		<path stroke={color} fill=transparent d={arc_path.single_svgPath}/>
	{:else}
		{#each arc_path.main_svgPaths as mainPath}
			<path stroke={color} fill=transparent d={mainPath}/>
		{/each}
		{#each arc_path.outer_svgPaths as outerPath}
			<path stroke={color} fill=transparent d={outerPath}/>
		{/each}
	{/if}
</svg>