<script lang='ts'>
	import { s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { k, Ancestry, ZIndex } from '../../ts/common/Global_Imports';
	import Color from './Color.svelte';
	let information: { [key: string]: string } = {}
	let ancestry: Ancestry | null = null;
	let info;
	
	$: {
		const grabs = $s_ancestries_grabbed;
		const hasNoGrabs = !grabs || (grabs.length < 1);
		ancestry = hasNoGrabs ? null : grabs[0];
		information = {
			'name' : ancestry.title.injectEllipsisAt(),
			'relationship' : ancestry.predicate?.description ?? k.empty,
			'direction' : ancestry.isNormal ? 'normal' : 'inverted',
			'id' : ancestry.id.injectEllipsisAt(),
		};
		info = Object.entries(information)
	}

</script>

<style>
	.first_column {
		border-right: 5px solid transparent;
		text-align: right;
		line-height:12px;
		width: 35%;
	}
	.second_column {
		line-height:12px;
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
			<tr>
				<td class='first_column'>color:</td>
				<td class='second_column'><Color/></td>
			</tr>
		</table>
	{/if}
</div>
