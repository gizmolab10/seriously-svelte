<script lang='ts'>
	import { s_ancestry_focus, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { k, show, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_thing_title, s_ancestry_card } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	export let top = 0;
	const id = 'info';
	const margin = 10;
	let rebuilds = 0;
	let information;
	
	$: {
		const ancestry = $s_ancestry_card;
		const thing = ancestry?.thing;
		if (!!thing) {
			const dict = {
				'relationship' : ancestry.predicate?.description ?? k.empty,
				'direction' : ancestry.isNormal ? 'normal' : 'inverted',
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
				top:{top}px;
				left:{margin}px;
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
