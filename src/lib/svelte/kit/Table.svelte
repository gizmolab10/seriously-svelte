<script lang='ts'>
	import { k, ZIndex } from '../../ts/common/Global_Imports';
	export let top = 0;
	export let dict;

</script>

<style>
	.first {
		border-right: 1px solid transparent;
		text-align: right;
		line-height:12px;
		color:black;
		width: 30%;
	}
	.second {
		line-height:12px;
	}
</style>

{#if dict}
	<div class='ancestry-info'
		style='
			left:10px;
			top:{top}px;
			position:absolute;
			z-index: {ZIndex.details};'>
		<table style='width: {k.width_details}px; left:12px; color:black;'>
			{#each dict as [key, value]}
				<tr>
					<td class='first'>{key}:</td>
					<td class='second'>{value}</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}
