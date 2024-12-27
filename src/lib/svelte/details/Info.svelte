<script lang='ts'>
	import { signals, InfoType, TraitType, persistLocal, ElementType, IDPersistent } from '../../ts/common/Global_Imports';
	import { g, k, ux, show, Rect, Size, Point, Thing, ZIndex, Ancestry } from '../../ts/common/Global_Imports';
	import { s_focus_ancestry, s_grabbed_ancestries, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { s_hierarchy, s_thing_color, s_thing_title } from '../../ts/state/Svelte_Stores';
	import type { Dictionary } from '../../ts/common/Types';
	import Identifiable from '../../ts/basis/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	import Color from './Color.svelte';
	import { onMount } from 'svelte';
	export let top = 71;
	const id = 'info';
	const margin = 10;
	const font_ratio = 0.8;
	const text_top = top + 52;
	const font_size = `${font_ratio}em`;
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
	let information: Array<Dictionary> = [];
	let color = k.thing_color_default;
	let grabs = $s_grabbed_ancestries;
	let thing_title = thing?.title;
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
		if (thing != ancestry?.thing) {
			update_forAncestry();
		}
	}

	function hasGrabs(): boolean {
		grabs = $s_grabbed_ancestries;
		return !!grabs && (grabs.length > 1 || !$s_focus_ancestry.isGrabbed);
	}

	function selection_closure(types: Array<string>) {
		const type = types[0];
		persistLocal.write_key(IDPersistent.info_type, type);
		show.info_type = type;
		update_forKind();
	}

	function update_forKind() {
		if (show.info_type == InfoType.focus || !hasGrabs()) {
			ancestry = $s_focus_ancestry;
		} else {
			grabs = $s_grabbed_ancestries;
			if (!!grabs && grabs.length > 0) {
				ancestry = grabs[0];
			}
		}
		update_forAncestry();
	}

	function update_forAncestry() {
		thing = ancestry?.thing;
		if (!!thing) {
			thing_title = thing.title;
			thingHID = thing.idHashed;
			const dict = {
				'relationship'	: ancestry.predicate?.description ?? 'none',
				'direction'		: ancestry.isParental ? 'child' : 'parent',
				'children'		: ancestry.children.length,
				'parents'		: thing.parents.length,
				'related'		: thing.relatedRelationships.length,
				'depth'			: ancestry.depth,
				'id'			: thing.id.clipWithEllipsisAt(12),
				'color'			: k.empty,
			};
			information = Object.entries(dict);
			rebuilds += 1;
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
				await $s_hierarchy.db.persistAll();
			})();
		}
	}

</script>

{#key rebuilds}
	{#if !!thing}
		<div class='info'
			style='
				color:black;
				top:{top}px;
				left:{margin}px;
				position:absolute;
				width:{traits_width}px;'>
			{#if information.length != 0}
				<Segmented
					name='info-type'
					font_size={font_size}
					origin={new Point(45, 0)}
					selected={[show.info_type]}
					height={k.row_height * font_ratio}
					selection_closure={selection_closure}
					titles={[InfoType.focus, InfoType.selection]}/>
				{#key thing_title}
					<div style='
						top:20px;
						position:absolute;
						text-align:center;
						width:{traits_width}px;'>
						{thing_title.clipWithEllipsisAt(30)}
					</div>
					<Separator top=36 width={traits_width}/>
				{/key}
				<Table top={39} array={information}/>
			{/if}
			<Color thing={thing} origin={new Point(73, 149)}/>
			{#if show.traits}
				<div class='horizontal-line'
					style='
						top:20px;
						left:{-margin}px;
						position:absolute;
						width:{k.width_details}px;
						z-index:{ZIndex.frontmost};'>
				</div>
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
