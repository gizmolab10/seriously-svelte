<script lang='ts'>
	import {k, layout, Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_graph_ofType } from '../../ts/managers/Stores';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
</script>

<div class='secondary'>
    <Separator name='secondary-separator'
        origin={new Point(24, $w_graph_rect.size.height + 4)}
        corner_radius={k.radius.gull_wings.thick}
        thickness={k.thickness.separator.main}
        length={$w_graph_rect.size.width + 3}
        zindex={T_Layer.frontmost}
        has_both_wings={true}
        isHorizontal={true}/>
	{#if $w_show_graph_ofType == T_Graph.tree}
		<Tree_Preferences top={0} width={117} zindex={T_Layer.frontmost}/>
	{/if}
</div>

<style>
	.secondary {
		position: absolute;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
