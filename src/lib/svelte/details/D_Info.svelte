<script lang='ts'>
	import { T_Thing, T_Trait, T_Layer, T_Element, T_Info, T_Preference } from '../../ts/common/Global_Imports';
	import { w_background_color, w_show_info_ofType, w_show_details_ofType } from '../../ts/common/Stores';
	import { w_ancestry_focus, w_ancestries_grabbed, w_relationship_order } from '../../ts/common/Stores';
	import { w_hierarchy, w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/common/Stores';
	import { grabs, debug, colors, signals, layout, Ancestry } from '../../ts/common/Global_Imports';
	import { c, k, p, ux, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import type { Integer } from '../../ts/common/Types';
	import Text_Table from '../kit/Text_Table.svelte';
	import Color from '../kit/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const id = 'info';
	const separator_font_size = k.font_size.smallest;
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.info, id);
	let ancestry: Ancestry | null = grabs.ancestry_forInfo;
	let thing: Thing | null = ancestry?.thing ?? null;
	let thingHID: Integer | null = thing?.hid;
	let color = colors.default_forThings;
	let info_details: Array<Object> = [];
	let thing_title = thing?.title;
	let color_origin = Point.zero;
	let picker_offset = k.empty;
	let info_table: any;

	$: $w_show_details_ofType, layout_forColor();
	$: $w_relationship_order, update_forAncestry();
	$: $w_show_info_ofType, $w_ancestries_grabbed, $w_ancestry_focus, $w_thing_title, update_forKind_ofInfo();

	onMount(() => {
		update_forKind_ofInfo();
		layout_forColor();
		es_info.set_forHovering(colors.default, 'pointer');
	});

	function update_forKind_ofInfo() {
		grabs.update_forKind_ofInfo()
		update_forAncestry();
	}

	function layout_forColor() {
		if (!!info_table) {
			const row = Math.max(0, info_details.findIndex(([key]) => key === 'color'));
			const offsetRow = info_table.location_ofCellAt(row, 1);
			color_origin = offsetRow.offsetByXY(-4, -4);
			picker_offset = `${9 - color_origin.x}px`;
		}
	}

	function update_forAncestry() {
		ancestry = grabs.ancestry_forInfo;
		thing = ancestry?.thing;
		if (!!thing) {
			thing_title = thing.title;
			thingHID = thing.hid;
			color = thing.color;
			info_details = [	
				['children', ancestry.children.length.expressZero_asHyphen()],
				['progeny', ancestry.progeny_count().expressZero_asHyphen()],
				['parents', thing.parents.length.expressZero_asHyphen()],
				['related', thing.relatedRelationships.length.expressZero_asHyphen()],
				['depth', ancestry.depth.expressZero_asHyphen()],
				['order', ancestry.order.expressZero_asHyphen()],
				['parent', ancestry.predicate.kind],
				['type', Object.keys(T_Thing).find(k => T_Thing[k] === thing.t_thing)],
				['id', thing.id.beginWithEllipsis_forLength(13)],
				['ancestry', ancestry.id.beginWithEllipsis_forLength(13)],
				['color', ancestry.isEditable ? k.empty : 'not editable'],
			];
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
			width: 100%;
			position:absolute;'>
		{#if info_details.length != 0}
			<Text_Table
				top = 0
				row_height={11}
				array={info_details}
				bind:this={info_table}
				name='information-table'
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
