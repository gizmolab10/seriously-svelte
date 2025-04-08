<script lang='ts'>
	import { w_hierarchy, w_ancestry_focus, w_user_graph_offset } from '../../ts/common/Stores';
	import { layout } from '../../ts/common/Global_Imports';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	const tree_trunk = layout.branches_areChildren ? $w_ancestry_focus : $w_hierarchy.grabs_latest_ancestry;
</script>

{#if !!tree_trunk}
	<div class = 'tree'
		style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Widget ancestry = {tree_trunk}/>
		<Tree_Branches ancestry = {tree_trunk}/>
	</div>
{/if}
