<script lang=ts>
	import { debug, Ancestry } from '../../ts/common/Global_Imports';
	import { w_show_related } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
	const g_treeBranches = ancestry.g_widget.g_treeBranches;
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_treeBranches.origin_ofLine}/>
{/if}
{#if !!ancestry}
	{#each ancestry.childAncestries as childAncestry}
		<Tree_Line g_line = {childAncestry.g_widget.g_line}/>
		<Widget ancestry = {childAncestry}/>
		{#if childAncestry.showsChildRelationships}
			<Tree_Branches ancestry = {childAncestry}/>
		{/if}
	{/each}
{/if}
