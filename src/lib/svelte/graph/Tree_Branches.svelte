<script lang=ts>
	import { debug, layout, Ancestry } from '../../ts/common/Global_Imports';
	import { w_show_related } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let depth: number;
	export let ancestry: Ancestry;
	export let show_child_branches = true;
	const g_childBranches = ancestry.g_widget.g_childBranches;

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
			<Widget ancestry = {branchAncestry}/>
			{#if branchAncestry.shows_branches && !layout.was_visited(branchAncestry)}
				<Tree_Branches ancestry = {branchAncestry} depth = {depth - 1}/>
			{/if}
			{#if $w_show_related && depth > 1}
				{#each ancestry.g_widget.g_bidirectionalLines as g_line}
					{#if g_line.depth_difference < (depth + 2)}
						<Tree_Line g_line = {g_line}/>
					{/if}
				{/each}
			{/if}
		{/each}
	{/if}
{/if}
