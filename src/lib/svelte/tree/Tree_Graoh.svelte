<script lang='ts'>
	import { w_graph_rect, w_hierarchy, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import { ux } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	
	$: {
		const _ = $w_hierarchy + $w_graph_rect + $w_ancestry_focus + $w_device_isMobile;
		ux.relayout_all();
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
