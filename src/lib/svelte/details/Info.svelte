<script lang='ts'>
	import { s_grabbed_color, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { k, Ancestry, ZIndex } from '../../ts/common/Global_Imports';
	import Color from './Color.svelte';
	let information: { [key: string]: string } = {}
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let color = k.color_default;
	let info;

	function hasGrabs(): boolean {
		return !!grabs && (grabs.length > 0);
	}
	
	$: {
		grabs = $s_ancestries_grabbed;
		if (hasGrabs()) {
			ancestry = grabs[0];
			color = ancestry.thing?.color ?? k.color_default;
			information = {
				'relationship' : ancestry.predicate?.description ?? k.empty,
				'direction' : ancestry.isNormal ? 'normal' : 'inverted',
				'id' : ancestry.thing?.id.injectEllipsisAt(),
			};
			info = Object.entries(information)

		}
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

{#if !!ancestry && hasGrabs()}
	<div style='
		text-align:center;
		color:{$s_grabbed_color};
		width:{k.width_details}px;'>
		{ancestry.title.injectEllipsisAt(15)}
	</div>
	<div class='horizontal-line'
		style='
			top:20px;
			height:0.5px;
			position:absolute;
			background-color:{color};
			width:{k.width_details}px;
			z-index:{ZIndex.frontmost};'>
	</div>
	<div class='ancestry-info'
		style='
			top:25px;
			left:15px;
			position:absolute;
			z-index: {ZIndex.details};'>
		<table style='width: 200px; left:12px; color:{$s_grabbed_color};'>
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
	</div>
{/if}
