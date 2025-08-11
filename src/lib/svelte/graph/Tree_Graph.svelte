<script lang='ts'>
	import { w_graph_rect, w_user_graph_offset } from '../../ts/common/Stores';
	import { w_depth_limit, w_ancestry_focus } from '../../ts/common/Stores';
	import { u, layout, T_Layer } from '../../ts/common/Global_Imports';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	let reattachments = 0;

	$: if ($w_depth_limit !== undefined) {
		reattachments++;
	}

</script>

{#key reattachments}
	{#if !!$w_ancestry_focus && !layout.branch_was_visited($w_ancestry_focus, true)}
		<div class = 'tree-graph'
			style = '
				position: absolute;
				z-index: {T_Layer.graph};
				border:10px solid transparent;
				top: {$w_user_graph_offset.y}px;
				left: {$w_user_graph_offset.x}px;
				width: {$w_graph_rect.size.width}px;
				height: {$w_graph_rect.size.height}px;
				transform: scale({layout.scale_factor});'>
			<Widget g_widget = {$w_ancestry_focus.g_widget}/>
			<Tree_Branches ancestry = {$w_ancestry_focus} depth = {$w_depth_limit}/>
		</div>
	{/if}
{/key}