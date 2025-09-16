<script lang='ts'>
	import { T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import { w_show_graph_ofType } from '../../ts/managers/Stores';
	import Tree_Preferences from './Tree_Preferences.svelte';
</script>

<div class='secondary'>
	{#if $w_show_graph_ofType == T_Graph.tree}
		<Tree_Preferences top={0} width={117} zindex={T_Layer.frontmost}/>
	{/if}
</div>

<style>
  .secondary {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
