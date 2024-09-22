<script lang='ts'>
	import { g, k, ux, Point, ZIndex, Ancestry, Info_Kind } from '../../ts/common/Global_Imports';
	import { persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { s_shown_relations, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Button from '../mouse buttons/Button.svelte';
	import { TextField } from 'svelte-ux';
	import Color from './Color.svelte';
	const id = 'info';
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let button_title = `show info for ${next_infoKind()}`;
	let information: { [key: string]: string } = {};
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let color = k.color_default;
	let rebuilds = 0;
	let info;
	
	$: {
		const _ = $s_ancestry_focus;
		update_forKind();
	}
	
	$: {
		const _ = $s_ancestries_grabbed;
		update_forKind();
	}
	
	$: {
		const _ = $s_thing_changed;
		color = ancestry.thing?.color ?? k.color_default;
		update_info();
		rebuilds += 1;
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

	function update_forKind() {
		button_title = `show info for ${next_infoKind()}`;
		if (g.shown_info_kind == Info_Kind.focus || !hasGrabs()) {
			ancestry = $s_ancestry_focus;
		} else {
			grabs = $s_ancestries_grabbed;
			ancestry = grabs[0];
		}
		update_info();
	}

	function update_info() {
		if (!!ancestry) {
			color = ancestry.thing?.color ?? k.color_default;
			element_state.set_forHovering(color, 'pointer');
			information = {
				'details' : ancestry.thing?.details.injectEllipsisAt(),
				'relationship' : ancestry.predicate?.description ?? k.empty,
				'direction' : ancestry.isNormal ? 'normal' : 'inverted',
				'id' : ancestry.thing?.id.injectEllipsisAt(),
			};
			info = Object.entries(information)
			rebuilds += 1;
		}
	}

	function button_closure_forID(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			g.shown_info_kind = next_infoKind();
			persistLocal.write_key(IDPersistant.info_kind, g.shown_info_kind);
			update_forKind();
		}
	}

	// import { Button, Segmented } from 'framework7-svelte';
			// <div
			// 	style='
			// 		top:86px;'>
			// 	<Segmented raised round tag="div">
			// 		<Button round>focus</Button>
			// 		<Button round active>selected</Button>
			// 	</Segmented>
			// </div>


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

{#key rebuilds}
	{#if !!ancestry}
		<div
			style='
				top:6px;
				color:{color};
				position:absolute;
				text-align:center;
				width:{k.width_details}px;'>
			{ancestry.title.injectEllipsisAt(15)}
		</div>
		<div class='horizontal-line'
			style='
				top:26px;
				height:0.5px;
				position:absolute;
				background-color:{color};
				width:{k.width_details}px;
				z-index:{ZIndex.frontmost};'>
		</div>
		<div class='ancestry-info'
			style='
				top:30px;
				left:10px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<table style='width: 200px; left:12px; color:{color};'>
				{#key info}
					{#each info as [key, value]}
						<tr>
							<td class='first_column'>{key}:</td>
							{#if key == 'details'}
								<td class='second_column'><TextField value={value}/></td>
							{:else}
								<td class='second_column'>{value}</td>
							{/if}
						</tr>
					{/each}
				{/key}
				<tr>
					<td class='first_column'>color:</td>
					<td class='second_column'><Color thing={ancestry.thing}/></td>
				</tr>
			</table>
		</div>
		{#if hasGrabs()}
			<Button name={name}
				width={k.width_details - 20}
				element_state={element_state}
				height={k.default_buttonSize + 4}
				center={new Point(k.width_details / 2, 132)}
				closure={(mouse_state) => button_closure_forID(mouse_state)}>
				{button_title}
			</Button>
		{/if}
	{/if}
{/key}
