<script lang='ts'>
	import { w_graph_rect, w_user_graph_offset } from '../../ts/common/Stores';
	import { w_depth_limit, w_ancestry_focus } from '../../ts/common/Stores';
	import { u, layout, T_Layer } from '../../ts/common/Global_Imports';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	const focus = $w_ancestry_focus;
	let reattachments = 0;

	$: $w_depth_limit, update_layout_andReattach();

	function update_layout_andReattach() {
		layout.grand_layout();
		reattachments++;
	}

</script>

{#key reattachments}
	{#if !!focus && !layout.branch_was_visited(focus, true)}
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
			<Widget g_widget = {focus.g_widget}/>
			<Tree_Branches ancestry = {focus} depth = {$w_depth_limit}/>
		</div>
	{/if}
{/key}
<Tree_Preferences top={0} width={117} zindex={T_Layer.graph}/>