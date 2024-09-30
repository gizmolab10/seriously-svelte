<script lang='ts'>
	import { g, k, ux, show, Rect, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_ancestry_card, s_ancestries_grabbed, s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import { Info_Kind, persistLocal, ElementType, IDPersistant } from '../../ts/common/Global_Imports';
	import { s_thing_color, s_thing_title, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import Identifiable from '../../ts/data/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import Color from './Color.svelte';
	const id = 'info';
	const margin = 10;
	const card_top = 4;
	const text_top = card_top + 52;
	const size_details = k.width_details - 30;
	const control_origin = new Point(122, text_top - 20);
	const control_size = new Size(size_details - 58, k.default_buttonSize + 4);
	const control_rect = Rect.createCenterRect(control_origin, control_size);
	const element_state = ux.elementState_for(new Identifiable(id), ElementType.info, id);
	let text_box_size = new Size(size_details - 4, 68);
	let information: { [key: string]: string } = {};
	let button_title = `show ${next_infoKind()}`;
	let ancestry: Ancestry | null = null;
	let grabs = $s_ancestries_grabbed;
	let thing: Thing | null = null;
	let card_title = thing?.title;
	let color = k.color_default;
	let rebuilds = 0;
	let info;

	element_state.set_forHovering('black', 'pointer');
	
	$: {
		const _ = `${$s_ancestries_grabbed} ${$s_ancestry_focus} ${$s_thing_title}`;
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
		switch (show.info_kind) {
			case Info_Kind.focus: return Info_Kind.selection;
			default:			  return Info_Kind.focus;
		}
	}

	function update_forKind() {
		button_title = `show ${next_infoKind()}`;
		if (show.info_kind == Info_Kind.focus || !hasGrabs()) {
			ancestry = $s_ancestry_focus;
		} else {
			grabs = $s_ancestries_grabbed;
			ancestry = grabs[0];
		}
		$s_ancestry_card = ancestry;
		thing = ancestry?.thing;
		card_title = thing?.title;
		rebuilds += 1;
	}

	function button_closure(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const kind = next_infoKind()
			persistLocal.write_key(IDPersistant.info_kind, kind);
			show.info_kind = kind;
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
				color:black;
				left:{margin}px;
				top:{card_top}px;
				position:absolute;
				text-align:center;
				width:{k.width_details - margin * 2}px;'>
			{#key card_title}
				{card_title.injectEllipsisAt(15)}
			{/key}
			<div class='horizontal-line'
				style='
					top:20px;
					height:1px;
					left:{-margin}px;
					position:absolute;
					width:{k.width_details}px;
					z-index:{ZIndex.frontmost};
					background-color:lightgray;'>
			</div>
			<Color thing={thing} top={control_rect.origin.y - 1} left=-2/>
			{#if hasGrabs()}
				<Button name={name}
					zindex={ZIndex.details}
					center={control_rect.center}
					element_state={element_state}
					width={control_rect.size.width}
					height={control_rect.size.height}
					closure={(mouse_state) => button_closure(mouse_state)}>
					<span style='font-family: {$s_thing_fontFamily};'>
						{button_title}
					</span>
				</Button>
			{/if}
			{#if show.quests}
				<Text_Editor
					color='black'
					top={text_top}
					label='consequence'
					width={text_box_size.width}
					height={text_box_size.height}
					original_text={thing?.consequence}
					handle_textChange={handle_textChange}/>
				<Text_Editor
					color='black'
					label='quest'
					top={text_top + 90}
					width={text_box_size.width}
					height={text_box_size.height}
					original_text={thing?.quest}
					handle_textChange={handle_textChange}/>
			{/if}
		</div>
	{/if}
{/key}
