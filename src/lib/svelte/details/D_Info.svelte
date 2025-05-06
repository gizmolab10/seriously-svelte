<script lang='ts'>
	import { w_ancestry_focus, w_ancestries_grabbed, w_thing_fontFamily, w_relationship_order } from '../../ts/common/Stores';
	import { T_Info, T_Trait, T_Layer, T_Element, T_Report, T_Preference } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_thing_color, w_thing_title, w_background_color } from '../../ts/common/Stores';
	import { c, k, p, ux, show, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import { debug, colors, signals, layout, Ancestry } from '../../ts/common/Global_Imports';
	import type { Integer, Dictionary } from '../../ts/common/Types';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const id = 'info';
	const text_top = top + 52;
	const info_width = k.width_details - 30;
	const traits_width = k.width_details - 20;
	const separator_font_size = k.font_size.smallest;
	const traits_center = new Point(122, text_top - 20);
	const traits_size = new Size(info_width - 58, k.size.button + 4);
	const traits_rect = Rect.createCenterRect(traits_center, traits_size);
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.info, id);
	let ancestry: Ancestry | null = $w_ancestry_focus;
	let thing: Thing | null = ancestry?.thing ?? null;
	let text_box_size = new Size(info_width - 4, 68);
	let thingHID: Integer | null = thing?.hid;
	let information: Array<Dictionary> = [];
	let color = colors.default_forThings;
	let grabs = $w_ancestries_grabbed;
	let thing_title = thing?.title;
	let color_origin = Point.zero;
	let picker_offset = k.empty;
	let info;

	layout.layout_tops_forInfo(1);
	layout_forColor();	// must call layout_tops_forInfo first
	es_info.set_forHovering(colors.default, 'pointer');

	$: $w_relationship_order, update_forAncestry();
	$: $w_ancestries_grabbed, $w_ancestry_focus, $w_thing_title, update_forKind();

	function hasGrabs(): boolean {
		grabs = $w_ancestries_grabbed;
		return !!grabs && (grabs.length > 1 || !$w_ancestry_focus.isGrabbed);
	}

	function selection_closure(t_infos: Array<string>) {
		const t_info = t_infos[0];
		p.write_key(T_Preference.info, t_info);
		show.t_info = t_info;
		update_forKind();
	}
	
	function layout_forColor() {
		const color_left = 61
		color_origin = new Point(color_left, layout.top_ofInfoAt(T_Info.color));
		picker_offset = `${-color_left - 10}px`;
	}

	function update_forKind() {
		if (show.t_info == T_Report.focus || !hasGrabs()) {
			ancestry = $w_ancestry_focus;
		} else {
			grabs = $w_ancestries_grabbed;
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
			thingHID = thing.hid;
			color = thing.color;
			const dict = {
				'depth'	   : ancestry.depth.expressZero_asHyphen(),
				'parent'   : ancestry.predicate.kind,
				'order'	   : ancestry.order.expressZero_asHyphen(),
				'children' : ancestry.children.length.expressZero_asHyphen(),
				'progeny'  : ancestry.progeny_count().expressZero_asHyphen(),
				'parents'  : thing.parents.length.expressZero_asHyphen(),
				'related'  : thing.relatedRelationships.length.expressZero_asHyphen(),
				'id'	   : thing.id.beginWithEllipsis_forLength(13),
				'ancestry' : ancestry.id.beginWithEllipsis_forLength(13),
				'color'	   : ancestry.isEditable ? k.empty : 'not editable',
			};
			information = Object.entries(dict);
		}
	}

	function handle_textChange(label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'quest':		thing.setTraitText_forType(text, T_Trait.quest);	   break;
				case 'consequence':	thing.setTraitText_forType(text, T_Trait.consequence); break;
			}
		} else if (!text) {		// do after test for k.empty, which also is interpreted as falsey
			(async () => {
				await $w_hierarchy.db.persist_all();
			})();
		}
	}

	function handle_colors(result: string) {
		thing.color = color = result;
		thing.signal_color_change();
		(async () => {
			await thing.persist();
		})();
	}

</script>

{#if !!thing}
	<div class='info'
		style='
			color:black;
			top:{top}px;
			position:absolute;
			width:{traits_width}px;'>
		{#if information.length != 0}
			<Segmented
				name='info-type'
				height={k.height.small}
				selected={[show.t_info]}
				font_size={k.font_size.small}px
				selection_closure={selection_closure}
				titles={[T_Report.focus, T_Report.selection]}
				origin={new Point(49, layout.top_ofInfoAt(T_Info.segments))}/>
			<Separator
				title='title'
				add_wings={true}
				width={k.width_details}
				margin={k.details_margin}
				thickness={k.thickness.thin}
				title_left={k.separator_title_left}
				title_font_size={separator_font_size}
				top={layout.top_ofInfoAt(T_Info.before_title)}/>
			<div style='
				white-space:pre;
				position:absolute;
				text-align:center;
				width:{traits_width}px;
				top:{layout.top_ofInfoAt(T_Info.title)}px;'>
				{thing_title.clipWithEllipsisAt(30)}
			</div>
			<Separator
				add_wings={true}
				width={k.width_details}
				margin={k.details_margin}
				thickness={k.thickness.thin}
				title_left={k.separator_title_left}
				top={layout.top_ofInfoAt(T_Info.after_title)}/>
			<Text_Table
				row_height={11}
				array={information}
				name='information-table'
				width = {k.width_details - 20}
				font_size={k.font_size.smaller}
				top = {layout.top_ofInfoAt(T_Info.table)}/>
		{/if}
		{#if !!ancestry && ancestry.isEditable}
			<Color
				color={color}
				origin={color_origin}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
		{/if}
		{#if show.traits}
			<div class='horizontal-line'
				style='
					left:-10px;
					position:absolute;
					width:{k.width_details}px;
					z-index:{T_Layer.frontmost};
					height:{k.thickness.thin}px;
					background-color:{colors.separator};'>
			</div>
			<Text_Editor
				label='consequence'
				color=colors.default
				width={text_box_size.width}
				height={text_box_size.height}
				original_text={thing.consequence}
				handle_textChange={handle_textChange}
				top={layout.top_ofInfoAt(T_Info.consequence)}/>
			<Text_Editor
				label='quest'
				color=colors.default
				original_text={thing.quest}
				width={text_box_size.width}
				height={text_box_size.height}
				handle_textChange={handle_textChange}
				top={layout.top_ofInfoAt(T_Info.quest)}/>
		{/if}
	</div>
{/if}
