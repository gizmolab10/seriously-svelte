<script lang='ts'>
	import { s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import { ZIndex } from '../../ts/common/Global_Imports';
	export let top = 0;
</script>

{#if !!$s_ancestry_showing_tools && $s_ancestry_showing_tools.isVisible}
	<div class='ancestry-info'
		style='
			left:10px;
			top:{top}px;
			position:absolute;
			z-index: {ZIndex.details};'>
		<Editing_Tools/>
	</div>
{/if}