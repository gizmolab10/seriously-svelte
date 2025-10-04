<script lang='ts'>
	import { x, layout, signals, S_Component } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Signal, T_Component } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_user_graph_offset } from '../../ts/managers/Stores';
	import { w_depth_limit, w_ancestry_focus } from '../../ts/managers/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	let s_component: S_Component;
	let reattachments = 0;

	s_component = signals.handle_anySignal_atPriority(3, $w_ancestry_focus, T_Component.tree, (t_signal, value): S_Component | null => {
		reattachments++;
	});

	onMount(() => { return () => s_component.disconnect(); });

</script>

{#key reattachments}
	{#if x.reset_scanOf_attached_branches() && !!$w_ancestry_focus}
		<div class = 'tree-graph'
			style = '
				position: absolute;
				z-index: {T_Layer.graph};
				left: {$w_user_graph_offset.x}px;
				top: {$w_user_graph_offset.y - 5}px;
				width: {$w_graph_rect.size.width}px;
				height: {$w_graph_rect.size.height}px;
				transform: scale({layout.scale_factor});'>
			<Widget g_widget = {$w_ancestry_focus.g_widget}/>
			{#if $w_ancestry_focus.shows_branches}
				<Tree_Branches ancestry = {$w_ancestry_focus} depth = {$w_depth_limit}/>
			{/if}
		</div>
	{/if}
{/key}