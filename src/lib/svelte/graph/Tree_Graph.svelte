<script lang='ts'>
	import { w_ancestry_focus, w_user_graph_offset } from '../../ts/common/Stores';
	import { layout } from '../../ts/common/Global_Imports';
	import { w_depth_limit } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	const focus = $w_ancestry_focus;
	let reattachments = 0;

	$: $w_depth_limit, reattachments++;
</script>

{#key reattachments}
	{#if !!focus && !layout.was_visited(focus, true)}
		<div class = 'tree'
			style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
			<Widget ancestry = {focus}/>
			<Tree_Branches ancestry = {focus} depth = {$w_depth_limit}/>
		</div>
	{/if}
{/key}