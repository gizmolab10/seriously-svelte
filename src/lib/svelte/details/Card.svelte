<script lang='ts'>
	import { g, k, ux, show, Rect, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_card_ancestry, s_grabbed_ancestries, s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import { s_color_thing, s_title_thing, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { persistLocal, ElementType, IDPersistent } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/basis/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import { h } from '../../ts/db/DBDispatch';
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
	let ancestry: Ancestry | null = $s_focus_ancestry;
	let information: { [key: string]: string } = {};
	let button_title = `show ${next_infoKind()}`;
	let thing: Thing | null = ancestry?.thing;
	let grabs = $s_grabbed_ancestries;
	let card_title = thing?.title;
	let color = k.color_default;
	let rebuilds = 0;
	let info;

	element_state.set_forHovering('black', 'pointer');
	
	$: {
		const _ = `${$s_grabbed_ancestries} ${$s_focus_ancestry} ${$s_title_thing}`;
		update_forKind();
	}
	
	$: {
		const id = $s_color_thing;
		if (!!thing && thing.id == id) {
			color = thing.color;
			rebuilds += 1;
		}
	}

	function hasGrabs(): boolean {
		grabs = $s_grabbed_ancestries;
		return !!grabs && (grabs.length > 1 || !$s_focus_ancestry.isGrabbed);
	}

	function next_infoKind() { return !show.focus_info; }

	function update_forKind() {
		button_title = `show ${next_infoKind() ? 'focus' : 'selection'}`;
		if (show.focus_info || !hasGrabs()) {
			ancestry = $s_focus_ancestry;
		} else {
			grabs = $s_grabbed_ancestries;
			ancestry = grabs[0];
		}
		$s_card_ancestry = ancestry;
		thing = ancestry?.thing;
		card_title = thing?.title;
		rebuilds += 1;
	}

	function button_closure(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const focus_info = next_infoKind();
			persistLocal.write_key(IDPersistent.focus_info, focus_info);
			show.focus_info = focus_info;
			update_forKind();
		}
	}

	function handle_textChange (label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'consequence': thing.consequence = text; break;
				case 'quest': thing.quest = text; break;
			}
			thing.remoteWrite();
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
					closure={button_closure}
					center={control_rect.center}
					element_state={element_state}
					width={control_rect.size.width}
					height={control_rect.size.height}>
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
