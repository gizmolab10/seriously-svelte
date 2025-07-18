<script lang='ts'>
	import { w_ancestry_focus, w_user_graph_offset } from '../../ts/common/Stores';
	import { layout } from '../../ts/common/Global_Imports';
	import { w_depth_limit } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Preferences from './Tree_Preferences.svelte';
	const focus = $w_ancestry_focus;
	let reattachments = 0;

	$: $w_depth_limit, update_layout_andReattach();

	function update_layout_andReattach() {
		layout.grand_layout();
		reattachments++;
	}

</script>

<Tree_Preferences top={0} width={120}/>
{#key reattachments}
	{#if !!focus && !layout.was_visited(focus, true)}
		<div class = 'tree'
			style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
			<Widget g_widget = {focus.g_widget}/>
			<Tree_Branches ancestry = {focus} depth = {$w_depth_limit}/>
		</div>
	{/if}
{/key}