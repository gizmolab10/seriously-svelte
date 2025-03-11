<script lang='ts'>
	import { c, k, u, ux, show, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Curve, T_Layer, T_Widget, T_Signal, T_Control, T_Element } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_hierarchy, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_id_popupView, w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import { G_Widget, Predicate, Ancestry, databases } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	
	$: {
		const _ = $w_ancestry_focus + $w_hierarchy + $w_device_isMobile + $w_graph_rect;
		ux.g_treeGraph.update_origins();
	}

</script>

{#if $w_ancestry_focus}
	<div class = 'tree'
		style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Widget ancestry = {$w_ancestry_focus}/>
		{#if $w_ancestry_focus.isExpanded}
			<Tree_Children ancestry = {$w_ancestry_focus}/>
		{/if}
	</div>
{/if}
