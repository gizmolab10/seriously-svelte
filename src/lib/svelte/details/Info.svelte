<script lang='ts'>
	import { s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { k, Ancestry, ZIndex } from '../../ts/common/Global_Imports';
	let information: { [key: string]: string } = {}
	let ancestry: Ancestry | null = null;
	const first_column_width = 30;
	const line_height = 10;
	let info;
	
	$: {
		const grabs = $s_ancestries_grabbed;
		const hasNoGrabs = !grabs || (grabs.length < 1);
		ancestry = hasNoGrabs ? null : grabs[0];
		information = {
			'name' : ancestry.title,
			'id' : ancestry.id,
			'points out' : ancestry.points_out,
			'relationship' : ancestry.predicate?.kind,
		};
		info = Object.entries(information)
	}

</script>

<style>
	.first_column {
		border-right: 5px solid transparent;
		text-align: right;
		line-height:10px;
		width: 35%;
	}
	.second_column {
		line-height:10px;
	}
</style>

<div class='ancestry-info'
	style='
		top:5px;
		left:0px;
		position:absolute;
		z-index: {ZIndex.details};'>
	{#if !!ancestry}
		<table style='width: 200px;'>
			{#key info}
				{#each info as [key, value]}
					<tr>
						<td class='first_column'>{key}:</td>
						<td class='second_column'>{value}</td>
					</tr>
				{/each}
			{/key}
		</table>
	{/if}
</div>
