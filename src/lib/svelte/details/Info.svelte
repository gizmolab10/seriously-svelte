<script lang='ts'>
	import { g, k, ux, Point, Thing, ZIndex, Ancestry, Info_Kind } from '../../ts/common/Global_Imports';
	import { s_thing_color, s_thing_title, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { s_shown_relations, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import Color from './Color.svelte';
	const id = 'info';
	const margin = 10;
	const size_details = k.width_details - 30;
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let button_title = `show info for ${next_infoKind()}`;
	let information: { [key: string]: string } = {};
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let thing: Thing | null = null;
	let color = k.color_default;
	let rebuilds = 0;
	let info;
	
	$: {
		const _ = $s_ancestry_focus;
		update_forKind();
		update_info();
	}
	
	$: {
		const _ = $s_ancestries_grabbed;
		update_forKind();
		update_info();
	}
	
	$: {
		const _ = $s_thing_color;
		update_forKind();
		color = ancestry?.thing?.color ?? k.color_default;
		// update_info();
	}
	
	$: {
		const _ = $s_thing_title;
		update_forKind();
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

	function update_forKind() {
		button_title = `show info for ${next_infoKind()}`;
		if (g.shown_info_kind == Info_Kind.focus || !hasGrabs()) {
			ancestry = $s_ancestry_focus;
		} else {
			grabs = $s_ancestries_grabbed;
			ancestry = grabs[0];
		}
		thing = ancestry?.thing;
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

	function button_closure_forID(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			g.shown_info_kind = next_infoKind();
			persistLocal.write_key(IDPersistant.info_kind, g.shown_info_kind);
			update_forKind();
			update_info();
		}
	}

	function handle_textChange (text: string) {
		if (!!thing) {
			thing.details = text;
			(async () => {
				await thing.remoteWrite();
			})();
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
	{#if !!thing}
		<div
			style='
				top:6px;
				color:black;
				position:absolute;
				text-align:center;
				width:{k.width_details}px;'>
			{ancestry.title.injectEllipsisAt(15)}
		</div>
		{#if hasGrabs()}
			<Button name={name}
				border_thickness=0.5
				width={size_details + margin}
				element_state={element_state}
				height={k.default_buttonSize + 4}
				center={new Point(k.width_details / 2, 36)}
				closure={(mouse_state) => button_closure_forID(mouse_state)}>
				{button_title}
			</Button>
		{/if}
		<Text_Editor
			top=56
			left={margin}
			color='black'
			width={size_details}
			height={size_details + 4}
			original_text={thing?.details}
			handle_textChange={handle_textChange}/>
		<div class='ancestry-info'
			style='
				top:241px;
				left:{margin}px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<table style='width: {k.width_details}px; left:12px; color:black;'>
				{#key info}
					{#each info as [key, value]}
						<tr>
							<td class='first'>{key}:</td>
							<td class='second'>{value}</td>
						</tr>
					{/each}
					<tr>
						<td class='first'>color:</td>
						<td class='second'><Color thing={thing}/></td>
					</tr>
				{/key}
			</table>
		</div>
	{/if}
{/key}
