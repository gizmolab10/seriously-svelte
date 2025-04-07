<script lang='ts'>
	import { w_ancestry_focus, w_user_graph_offset } from '../../ts/common/Stores';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
</script>

{#if $w_ancestry_focus}
	<div class = 'tree'
		style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Widget ancestry = {$w_ancestry_focus}/>
		{#if $w_ancestry_focus.isExpanded}
			<Tree_Branches ancestry = {$w_ancestry_focus}/>
		{/if}
	</div>
{/if}
