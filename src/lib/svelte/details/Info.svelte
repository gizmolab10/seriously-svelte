<script lang='ts'>
	import { k, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	export let ancestry: Ancestry;
	export let top = 0;
	let rebuilds = 0;
	let information;
	
	$: {
		const thing = ancestry?.thing;
		if (!!thing) {
			const dict = {
				'relationship' : ancestry.predicate?.description ?? k.empty,
				'direction' : ancestry.isParental ? 'to child' : 'to parent',
				'id' : thing?.id.injectEllipsisAt(),
			};
			information = Object.entries(dict)
			rebuilds += 1;
		}
	}

</script>

<style>
	.first {
		border-right: 5px solid transparent;
		text-align: right;
		line-height:12px;
		color:black;
		width: 35%;
	}
	.second {
		line-height:12px;
	}
</style>

{#key rebuilds}
	{#if information}
		<div class='ancestry-info'
			style='
				left:10px;
				top:{top}px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<table style='width: {k.width_details}px; left:12px; color:black;'>
				{#key information}
					{#each information as [key, value]}
						<tr>
							<td class='first'>{key}:</td>
							<td class='second'>{value}</td>
						</tr>
					{/each}
				{/key}
			</table>
		</div>
	{/if}
{/key}
