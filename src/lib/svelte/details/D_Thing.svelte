<script lang='ts'>
	import { w_ancestry_focus, w_ancestries_grabbed, w_relationship_order } from '../../ts/common/Stores';
	import { T_Thing, T_Trait, T_Layer, T_Element, T_Preference } from '../../ts/common/Global_Imports';
	import { grabs, debug, colors, signals, layout, Ancestry } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/common/Stores';
	import { c, k, p, ux, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import { w_background_color, w_show_details_ofType } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import type { Integer } from '../../ts/common/Types';
	import Text_Table from '../kit/Text_Table.svelte';
	import Color from '../kit/Color.svelte';
	import Portal from 'svelte-portal';
	import { onMount } from 'svelte';
	export let top = 4;
	const id = 'selection';
	const separator_font_size = k.font_size.smallest;
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.thing, id);
	let ancestry: Ancestry | null = grabs.latest;
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
	$: $w_ancestries_grabbed, $w_ancestry_focus, $w_thing_title, update_forAncestry();

	onMount(() => {
		update_forAncestry();
		layout_forColor();
		es_info.set_forHovering(colors.default, 'pointer');
	});

	function layout_forColor() {
		if (!!info_table) {
			const row = Math.max(0, info_details.findIndex(([key]) => key === 'color'));
			const offsetRow = info_table.absolute_location_ofCellAt(row, 1);
			color_origin = offsetRow.offsetByXY(-6, -6);
			picker_offset = `${color_origin.x - 103}px`;
		}
	}

	function handle_colors(result: string) {
		thing.color = color = result;
		thing.signal_color_change();
		(async () => {
			await thing.persist();
		})();
	}

	function update_forAncestry() {
		ancestry = grabs.latest;
		thing = ancestry?.thing;
		if (!!thing) {
			thing_title = thing.title;
			thingHID = thing.hid;
			color = thing.color;
			info_details = [	
				['children', ancestry.children.length.supressZero()],
				['progeny', ancestry.progeny_count().supressZero()],
				['parents', thing.parents.length.supressZero()],
				['related', thing.relatedRelationships.length.supressZero()],
				['depth', ancestry.depth.supressZero()],
				['order', ancestry.order.supressZero()],
				['parent', ancestry.predicate.kind],
				['type', Object.keys(T_Thing).find(k => T_Thing[k] === thing.t_thing)],
				['id', thing.id.beginWithEllipsis_forLength(17)],
				['ancestry', ancestry.id.beginWithEllipsis_forLength(19)],
				['modified', thing.persistence.lastModifyDate.toLocaleString()],
				['color', ancestry.isEditable ? k.empty : 'not editable'],
			];
			layout_forColor();
		}
	}

</script>

{#if !!thing}
	<div class='properties-container' 
		style='
			left:4px;
			width:100%;
			color:black;
			top:{top}px;
			height:auto;
			position:relative;
			padding-bottom:8px;
			z-index:{T_Layer.frontmost};'>
		{#if info_details.length != 0}
			<Text_Table
				top={0}
				row_height={11}
				array={info_details}
				bind:this={info_table}
				name='propertie-table'
				font_size={k.font_size.smaller}/>
		{/if}
		{#if !!ancestry && ancestry.isEditable}
			<Portal>
				<Color
					color={color}
					origin={color_origin}
					color_closure={handle_colors}
					picker_offset={picker_offset}/>
			</Portal>
		{/if}
	</div>
{/if}
