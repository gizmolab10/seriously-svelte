<script lang=ts>
	import { debug, Ancestry } from '../../ts/common/Global_Imports';
	import { w_show_related } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
	const g_treeChildren = ancestry.g_widget.g_treeChildren;
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_treeChildren.origin_ofLine}/>
{/if}
{#if !!ancestry}
	{#each ancestry.childAncestries as childAncestry}
		<Tree_Line g_line = {childAncestry.g_widget.g_line}/>
		<Widget ancestry = {childAncestry}/>
		{#if childAncestry.showsChildRelationships}
			<Tree_Children ancestry = {childAncestry}/>
		{/if}
	{/each}
	{#if $w_show_related}
		{#each ancestry.g_widget.g_bidirectionalLines as g_line}	<!-- can be zero lines -->
			<Tree_Line g_line = {g_line}/>
		{/each}
	{/if}
{/if}
