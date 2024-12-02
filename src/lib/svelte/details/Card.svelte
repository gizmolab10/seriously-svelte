<script lang='ts'>
	import { signals, TraitType, persistLocal, ElementType, IDPersistent } from '../../ts/common/Global_Imports';
	import { g, k, ux, show, Rect, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_focus_ancestry, s_grabbed_ancestries, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { s_hierarchy, s_thing_color, s_thing_title } from '../../ts/state/Svelte_Stores';
	import Identifiable from '../../ts/basis/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import type { Dictionary } from '../common/Types';
	import Button from '../mouse/Button.svelte';
	import Color from './Color.svelte';
	import Info from './Info.svelte';
	import { onMount } from 'svelte';
	export let top = 71;
	const id = 'info';
	const margin = 10;
	const text_top = top + 52;
	const details_size = k.width_details - 30;
	const card_center = new Point(122, text_top - 20);
	const card_size = new Size(details_size - 58, k.default_buttonSize + 4);
	const card_rect = Rect.createCenterRect(card_center, card_size);
	const element_state = ux.element_state_for(new Identifiable(id), ElementType.info, id);
	let color_origin = new Point(-2, card_rect.origin.y - (show.traits ? 1 : 24));
	let text_box_size = new Size(details_size - 4, 68);
	let ancestry: Ancestry | null = $s_focus_ancestry;
	let thing: Thing | null = ancestry?.thing;
	let thingHID: number | null = thing?.idHashed;
	let button_title = `show ${next_infoKind()}`;
	let information: Dictionary<string> = {};
	let color = k.thing_color_default;
	let grabs = $s_grabbed_ancestries;
	let card_title = thing?.title;
	let rebuilds = 0;
	let info;

	element_state.set_forHovering(k.color_default, 'pointer');
	
	onMount(() => {
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		const _ = `${$s_grabbed_ancestries} ${$s_focus_ancestry} ${$s_thing_title}`;
		update_forKind();
	}
	
	$: {
		const id = $s_thing_color;
		if (!!thing && thing.id == id) {
			color = thing.color;
			rebuilds += 1;
		}
	}

	function hasGrabs(): boolean {
		grabs = $s_grabbed_ancestries;
		return !!grabs && (grabs.length > 1 || !$s_focus_ancestry.isGrabbed);
	}

	function next_infoKind() { return !show.thing_info; }

	function update_forKind() {
		button_title = `show ${next_infoKind() ? 'focus' : 'selection'}`;
		if (show.thing_info || !hasGrabs()) {
			ancestry = $s_focus_ancestry;
		} else {
			grabs = $s_grabbed_ancestries;
			ancestry = grabs[0];
		}
		thing = ancestry?.thing;
		thingHID = thing?.idHashed;
		card_title = thing?.title;
		rebuilds += 1;
	}

	function mouse_state_closure(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const thing_info = next_infoKind();
			persistLocal.write_key(IDPersistent.thing_info, thing_info);
			show.thing_info = thing_info;
			update_forKind();
		}
	}

	function handle_textChange (label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'quest':		thing.setTraitText_forType(text, TraitType.quest);		 break;
				case 'consequence':	thing.setTraitText_forType(text, TraitType.consequence); break;
			}
		} else if (!text) {
			$s_hierarchy.deferredWriteAll();
		}
	}

</script>

{#key rebuilds}
	{#if !!thing}
		<div class='card'
			style='
				color:black;
				top:{top}px;
				left:{margin}px;
				position:absolute;
				text-align:center;
				width:{k.width_details - (margin * 2)}px;'>
			<Color thing={thing} origin={color_origin}/>
			{#if show.traits}
				{#key card_title}
					{card_title.injectEllipsisAt(15)}
				{/key}
				<div class='horizontal-line'
					style='
						top:20px;
						left:{-margin}px;
						position:absolute;
						width:{k.width_details}px;
						z-index:{ZIndex.frontmost};'>
				</div>
				{#if hasGrabs()}
					<Button name={name}
						zindex={ZIndex.details}
						center={card_rect.center}
						closure={mouse_state_closure}
						element_state={element_state}
						width={card_rect.size.width}
						height={card_rect.size.height}>
						<span style='font-family: {$s_thing_fontFamily};'>
							{button_title}
						</span>
					</Button>
				{/if}
				<Text_Editor
					color=k.color_default
					top={text_top}
					label='consequence'
					width={text_box_size.width}
					height={text_box_size.height}
					original_text={thing.consequence}
					handle_textChange={handle_textChange}/>
				<Text_Editor
					color=k.color_default
					label='quest'
					top={text_top + 90}
					original_text={thing.quest}
					width={text_box_size.width}
					height={text_box_size.height}
					handle_textChange={handle_textChange}/>
			{/if}
		</div>
		{#if show.thing_info}
			<Info top={top + 10} ancestry={ancestry}/>
		{/if}
	{/if}
{/key}
