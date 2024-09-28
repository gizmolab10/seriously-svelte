<script lang='ts'>
	import { g, k, ux, show, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { Info_Kind, persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { s_thing_color, s_thing_title, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { s_ancestry_card, s_ancestries_grabbed } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import Color from './Color.svelte';
	const id = 'info';
	const margin = 10;
	const card_top = 18;
	const size_details = k.width_details - 30;
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let information: { [key: string]: string } = {};
	let box_size = new Size(size_details - 8, 64);
	let button_title = `show ${next_infoKind()}`;
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let thing: Thing | null = null;
	let color = k.color_default;
	let rebuilds = 0;
	let info;

	element_state.set_forHovering('black', 'pointer');
	
	$: {
		const _ = `${$s_ancestries_grabbed} ${$s_ancestry_focus} {$s_thing_title}`;
		update_forKind();
	}
	
	$: {
		const _ = $s_thing_color;
		color = ancestry?.thing?.color ?? k.color_default;
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
		button_title = `show ${next_infoKind()}`;
		if (g.shown_info_kind == Info_Kind.focus || !hasGrabs()) {
			ancestry = $s_ancestry_focus;
		} else {
			grabs = $s_ancestries_grabbed;
			ancestry = grabs[0];
		}
		$s_ancestry_card = ancestry;
		thing = ancestry?.thing;
		rebuilds += 1;
	}

	function button_closure(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const kind = next_infoKind()
			persistLocal.write_key(IDPersistant.info_kind, kind);
			g.shown_info_kind = kind;
			update_forKind();
		}
	}

	function handle_textChange (label: string, text: string) {
		if (!!thing) {
			switch (label) {
				case 'consequence': thing.consequence = text; break;
				case 'quest': thing.quest = text; break;
			}
			(async () => {
				await thing.remoteWrite();
			})();
		}
	}

</script>

{#key rebuilds}
	{#if !!thing}
		<div class='card'
			style='
				top:6px;
				color:black;
				left:{margin}px;
				position:absolute;
				text-align:center;
				width:{k.width_details - margin * 2}px;'>
			{ancestry.title.injectEllipsisAt(15)}
			{#if hasGrabs()}
				<Button name={name}
					border_thickness=0.5
					width={size_details - 50}
					element_state={element_state}
					height={k.default_buttonSize + 4}
					center={new Point(60, card_top + 11.5)}
					closure={(mouse_state) => button_closure(mouse_state)}>
					{button_title}
				</Button>
			{/if}
			<Color thing={thing} top={card_top} left=124/>
			{#if show.quests}
				<Text_Editor
					color='black'
					label='consequence'
					top={card_top + 29}
					width={box_size.width}
					height={box_size.height}
					original_text={thing?.consequence}
					handle_textChange={handle_textChange}/>
				<Text_Editor
					top={card_top + 119}
					color='black'
					label='quest'
					width={box_size.width}
					height={box_size.height}
					original_text={thing?.quest}
					handle_textChange={handle_textChange}/>
			{/if}
		</div>
	{/if}
{/key}
