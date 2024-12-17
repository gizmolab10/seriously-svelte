<script lang='ts'>
	import { signals, TraitType, persistLocal, ElementType, IDPersistent } from '../../ts/common/Global_Imports';
	import { g, k, ux, show, Rect, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_focus_ancestry, s_grabbed_ancestries, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { s_hierarchy, s_thing_color, s_thing_title } from '../../ts/state/Svelte_Stores';
	import type { Dictionary } from '../../ts/common/Types';
	import Identifiable from '../../ts/basis/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	import Color from './Color.svelte';
	import { onMount } from 'svelte';
	export let top = 71;
	const id = 'info';
	const margin = 10;
	const text_top = top + 52;
	const info_width = k.width_details - 30;
	const traits_width = k.width_details - (margin * 2);
	const traits_center = new Point(122, text_top - 20);
	const traits_size = new Size(info_width - 58, k.default_buttonSize + 4);
	const traits_rect = Rect.createCenterRect(traits_center, traits_size);
	const element_state = ux.element_state_for(new Identifiable(id), ElementType.info, id);
	let ancestry: Ancestry | null = $s_focus_ancestry;
	let thing: Thing | null = ancestry?.thing ?? null;
	let text_box_size = new Size(info_width - 4, 68);
	let thingHID: number | null = thing?.idHashed;
	let button_title = `show ${next_infoKind()}`;
	let information: Dictionary<string> = {};
	let color_origin = new Point(76, 83);
	let color = k.thing_color_default;
	let grabs = $s_grabbed_ancestries;
	let traits_title = thing?.title;
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
	
	$: {
		const thing = ancestry?.thing;
		if (!!thing) {
			const dict = {
				'relationship'	: ancestry.predicate?.description ?? k.empty,
				'direction'		: ancestry.isParental ? 'child' : 'parent',
				'depth'			: ancestry.depth,
				'id'			: thing?.id.clipWithEllipsisAt(),
				'color'			: k.empty,
			};
			information = Object.entries(dict)
			rebuilds += 1;
		}
	}

	function hasGrabs(): boolean {
		grabs = $s_grabbed_ancestries;
		return !!grabs && (grabs.length > 1 || !$s_focus_ancestry.isGrabbed);
	}

	function next_infoKind() { return !show.focus_info; }	// just toggle (boolean)

	function update_forKind() {
		const showing = next_infoKind() ? 'focus' : 'selection';
		button_title = `show ${showing}`;
		if (show.focus_info || !hasGrabs()) {
			ancestry = $s_focus_ancestry;
		} else {
			grabs = $s_grabbed_ancestries;
			ancestry = grabs[0];
		}
		thing = ancestry?.thing;
		thingHID = thing?.idHashed;
		traits_title = thing?.title;
		rebuilds += 1;
	}

	function mouse_state_closure(mouse_state) {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const focus_info = next_infoKind();
			persistLocal.write_key(IDPersistent.focus_info, focus_info);
			show.focus_info = focus_info;
			update_forKind();
		}
	}

	function handle_textChange(label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'quest':		thing.setTraitText_forType(text, TraitType.quest);		 break;
				case 'consequence':	thing.setTraitText_forType(text, TraitType.consequence); break;
			}
		} else if (!text) {		// do after test for k.empty, which also is interpreted as falsey
			(async () => {
				await $s_hierarchy.db.deferred_persistAll();
			})();
		}
	}

</script>

{#key rebuilds}
	{#if !!thing}
		<div class='info'
			style='
				color:black;
				top:{top - 4}px;
				left:{margin}px;
				position:absolute;
				width:{traits_width}px;'>
			{#if information}
				{#key traits_title}
					<div style='
						text-align:center;
						width:{traits_width}px;'>
						{traits_title.clipWithEllipsisAt(15)}
					</div>
					<Separator top=18 width={traits_width}/>
				{/key}
				<Table top={20} dict={information}/>
			{/if}
			<Color thing={thing} origin={color_origin}/>
			{#if show.traits}
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
						center={traits_rect.center}
						closure={mouse_state_closure}
						element_state={element_state}
						width={traits_rect.size.width}
						height={traits_rect.size.height}>
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
	{/if}
{/key}
