<script lang='ts'>
	import { c, g, k, u, show, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Line, T_Layer, T_Widget, T_Signal, T_Control, T_Element } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_hierarchy, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_id_popupView, w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import { G_Widget, Predicate, Ancestry, databases } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import { onMount } from 'svelte';
	const g_treeGraph = g.g_treeGraph;
	let rebuilds = 0;
	
	onMount(() => {
		const handler = signals.handle_reposition_widgets(0, (received_ancestry) => {
			if (!received_ancestry || (!!$w_ancestry_focus && $w_ancestry_focus.pathString == received_ancestry.pathString)) {
				debug.log_reposition(`tree graph [ ] on "${$w_ancestry_focus.title}"`);
				g_treeGraph.update_origins();
			}
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		const _ = $w_ancestry_focus + $w_hierarchy + $w_device_isMobile + $w_graph_rect;
		g_treeGraph.update_origins();
		rebuilds += 1;
	}

</script>

{#if $w_ancestry_focus}
	{#key rebuilds}
		<div class = 'tree'
			style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
			<Widget g_widget = {g_treeGraph.g_focus_widget}/>
			{#if $w_ancestry_focus.isExpanded}
				<Tree_Children g_tree_widget = {g_treeGraph.g_focus_widget}/>
			{/if}
		</div>
	{/key}
{/if}
