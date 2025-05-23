<script lang='ts'>
	import { w_ancestry_focus, w_ancestries_grabbed, w_thing_fontFamily, w_relationship_order } from '../../ts/common/Stores';
	import { T_Thing, T_Trait, T_Layer, T_Element, T_Info, T_Preference } from '../../ts/common/Global_Imports';
	import { w_show_info_ofType, w_hierarchy, w_thing_color, w_thing_title, w_background_color } from '../../ts/common/Stores';
	import { debug, colors, signals, layout, Ancestry } from '../../ts/common/Global_Imports';
	import { c, k, p, ux, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import type { Integer, Dictionary } from '../../ts/common/Types';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const id = 'info';
	const separator_font_size = k.font_size.smallest;
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.info, id);
	let ancestry: Ancestry | null = s_details.ancestry;
	let thing: Thing | null = ancestry?.thing ?? null;
	let thingHID: Integer | null = thing?.hid;
	let information: Array<Dictionary> = [];
	let color = colors.default_forThings;
	let thing_title = thing?.title;
	let color_origin = Point.zero;
	let picker_offset = k.empty;
	let info_table: any;

	$: $w_relationship_order, update_forAncestry();
	$: $w_show_info_ofType, $w_ancestries_grabbed, $w_ancestry_focus, $w_thing_title, update_forKind();

	onMount(() => {
		update_forKind();
		layout_forColor();
		es_info.set_forHovering(colors.default, 'pointer');
	});

	function update_forKind() {
		s_details.update_forKind()
		update_forAncestry();
	}

	function layout_forColor() {
		if (!!info_table) {
			const offsetY = s_details.number_ofDetails / 1.5 - 61 - top;
			const row = Math.max(0, information.findIndex(([key]) => key === 'color'));
			color_origin = info_table.location_ofCellAt(row, 1).offsetByXY(-4, offsetY);
			picker_offset = `${4 - color_origin.x}px`;
		}
	}

	function update_forAncestry() {
		ancestry = s_details.ancestry;
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
				'type'	   : Object.keys(T_Thing).find(k => T_Thing[k] === thing.t_thing),
				'ancestry' : ancestry.id.beginWithEllipsis_forLength(13),
				'color'	   : ancestry.isEditable ? k.empty : 'not editable',
			};
			information = Object.entries(dict);
			layout_forColor();
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
			width:{k.width_details - 20}px;'>
		{#if information.length != 0}
			<Text_Table
				top = 0
				row_height={11}
				array={information}
				bind:this={info_table}
				name='information-table'
				width = {k.width_details - 20}
				font_size={k.font_size.smaller}/>
		{/if}
		{#if !!ancestry && ancestry.isEditable}
			<Color
				color={color}
				origin={color_origin}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
		{/if}
	</div>
{/if}
