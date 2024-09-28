<script lang='ts'>
	import { Info_Kind, persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { g, k, ux, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_thing_title, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { s_shown_relations, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	const id = 'info';
	const margin = 10;
	const size_details = k.width_details - 30;
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let button_title = `show info for ${next_infoKind()}`;
	let information: { [key: string]: string } = {};
	let box_size = new Size(size_details - 8, 64);
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let thing: Thing | null = null;
	let rebuilds = 0;
	let info;
	
	$: {
		const a = $s_ancestries_grabbed;
		const b = $s_ancestry_focus;
		const c = $s_thing_title;
		update_info();
	}

	function hasGrabs(): boolean {
		grabs = $s_ancestries_grabbed;
		return !!grabs && (grabs.length > 1 || !$s_ancestry_focus.isGrabbed);
	}

	function next_infoKind() {
		switch (g.shown_info_kind) {
			case Info_Kind.focus: return Info_Kind.selection;
			default:			  return Info_Kind.focus;
		}
	}

	function update_info() {
		if (!!thing) {
			element_state.set_forHovering('black', 'pointer');
			information = {
				'relationship' : ancestry.predicate?.description ?? k.empty,
				'direction' : ancestry.isNormal ? 'normal' : 'inverted',
				'id' : thing?.id.injectEllipsisAt(),
			};
			info = Object.entries(information)
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
	{#if info}
		<div class='ancestry-info'
			style='
				left:{margin}px;
				position:absolute;
				z-index: {ZIndex.details};
				top:{g.show_quests ? 235 : 50}px;'>
			<table style='width: {k.width_details}px; left:12px; color:black;'>
				{#key info}
					{#each info as [key, value]}
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
