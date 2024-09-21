<script lang='ts'>
	import { g, k, ux, Point, ZIndex, Ancestry, Info_Kind } from '../../ts/common/Global_Imports';
	import { persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { s_shown_relations, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Button from '../mouse buttons/Button.svelte';
	import Color from './Color.svelte';
	const id = 'info';
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let information: { [key: string]: string } = {};
	let ancestry: Ancestry | null = null;
	let button_title = next_infoKind();
	let grabs = $s_ancestries_grabbed;
	let color = k.color_default;
	let rebuilds = 0;
	let info;
	
	$: {
		const _ = $s_thing_changed;
		rebuilds += 1;
	}
	
	$: {
		ancestry = $s_ancestry_focus;
		update_info();
	}
	
	$: {
		grabs = $s_ancestries_grabbed;
		update_forKind();
	}

	function hasGrabs(): boolean { return !!grabs && (grabs.length > 0); }
	function show_button(): boolean { return hasGrabs() && !$s_ancestry_focus.isGrabbed; }

	function next_infoKind() {
		switch (g.shown_info_kind) {
			case Info_Kind.focus: return Info_Kind.selection;
			default:			  return Info_Kind.focus;
		}
	}

	function update_forKind() {
		button_title = `show info for ${next_infoKind()}`;
		if (g.shown_info_kind == Info_Kind.selection && hasGrabs()) {
			ancestry = grabs[0];
		} else {
			ancestry = $s_ancestry_focus;
		}
		update_info();
	}

	function update_info() {
		color = ancestry.thing?.color ?? k.color_default;
		element_state.set_forHovering(color, 'pointer');
		information = {
			'relationship' : ancestry.predicate?.description ?? k.empty,
			'direction' : ancestry.isNormal ? 'normal' : 'inverted',
			'id' : ancestry.thing?.id.injectEllipsisAt(),
		};
		info = Object.entries(information)
		rebuilds += 1;
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
				left:15px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<table style='width: 200px; left:12px; color:{color};'>
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
					<td class='second_column'><Color thing={ancestry.thing}/></td>
				</tr>
			</table>
		</div>
		{#if show_button()}
			<Button name={name}
				width={k.width_details - 20}
				element_state={element_state}
				height={k.default_buttonSize + 4}
				center={new Point(k.width_details / 2, 115)}
				closure={(mouse_state) => button_closure_forID(mouse_state)}>
				{button_title}
			</Button>
		{/if}
	{/if}
{/key}
