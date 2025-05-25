<script lang=ts>
	import { debug, layout, Ancestry } from '../../ts/common/Global_Imports';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
	export let show_child_branches = true;
	const g_childBranches = ancestry.g_widget.g_childBranches;
	// console.log(`${ancestry.id}\n     { ${ancestry.branchAncestries.map(a => a.id).join(',\n       ')} }`)
</script>

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
			<Tree_Branches ancestry = {branchAncestry}/>
		{/if}
	{/each}
{/if}
