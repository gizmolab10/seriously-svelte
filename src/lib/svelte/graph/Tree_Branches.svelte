<script lang=ts>
	import { debug, layout, Ancestry } from '../../ts/common/Global_Imports';
	import { w_show_related } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../draw/Circle.svelte';
	export let depth: number;
	export let ancestry: Ancestry;
	export let show_child_branches = true;
	const g_widget = ancestry.g_widget;
	const g_childBranches = g_widget.g_childBranches;

</script>

{#if depth > 0}
	{#if debug.lines}
		<Circle
			radius = 1
			thickness = 1
			color = black
			center = {g_childBranches.origin_ofLine}/>
	{/if}
	{#if !!ancestry}
		{#each ancestry.branchAncestries as branchAncestry}
			<Tree_Line g_line = {branchAncestry.g_widget.g_line}/>
			<Widget g_widget = {branchAncestry.g_widget}/>
			{#if branchAncestry.shows_branches && !layout.branch_was_visited(branchAncestry)}
				<Tree_Branches ancestry = {branchAncestry} depth = {depth - 1}/>
			{/if}
		{/each}
		{#if $w_show_related && depth > 1}
			{#each g_widget.g_bidirectionalLines as g_line}
				{#if g_line.depth_ofLine < (depth + 2)}
					<Tree_Line g_line = {g_line}/>
				{/if}
			{/each}
		{/if}
	{/if}
{/if}
