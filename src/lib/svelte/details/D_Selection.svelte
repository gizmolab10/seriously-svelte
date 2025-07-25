<script lang='ts'>
	import { c, k, p, ux, grabs, colors, layout, Rect, Size, Point, Thing, Ancestry } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_ancestries_grabbed, w_relationship_order } from '../../ts/common/Stores';
	import { T_Thing, T_Trait, T_Layer, T_Element, T_Preference } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_background_color, w_show_details_ofType } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import { s_details } from '../../ts/state/S_Details';
	import type { Integer } from '../../ts/common/Types';
	import Text_Table from '../text/Text_Table.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Portal from '../draw/Portal.svelte';
	import Color from '../mouse/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 6;
	const id = 'selection';
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.details, id);
	let ancestry: Ancestry | null = grabs.ancestry;
	let thing: Thing | null = ancestry?.thing ?? null;
	let thingHID: Integer | null = thing?.hid;
	let characteristics: Array<Object> = [];
	let relationships: Array<Object> = [];
	let properties: Array<Object> = [];
	let color = colors.default_forThings;
	let thing_title = thing?.title;
	let color_origin = Point.zero;
	let picker_offset = k.empty;
	let info_table: any;

	$: $w_show_details_ofType, layout_forColor();
	$: $w_relationship_order, update_forAncestry();
	$: $w_ancestries_grabbed, $w_ancestry_focus, $w_thing_title, update_forAncestry();
	function handle_toggle_properties(event: Event) { s_details.show_properties = !s_details.show_properties; }

	onMount(() => {
		update_forAncestry();
		layout_forColor();
		es_info.set_forHovering(colors.default, 'pointer');
	});

	function layout_forColor() {
		if (!!info_table) {
			const row = Math.max(0, characteristics.findIndex(([key]) => key === 'color'));
			const offset_toRow = info_table.absolute_location_ofCellAt(row, 1);
			color_origin = offset_toRow.offsetByXY(-6, -5.5);
			picker_offset = `-54px`;
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
		ancestry = grabs.ancestry;
		thing = ancestry?.thing;
		if (!!thing) {
			thing_title = thing.title;
			thingHID = thing.hid;
			color = thing.color;
			characteristics = [
				['modified', thing.persistence.lastModifyDate.toLocaleString()],
				['color', ancestry.isEditable ? k.empty : 'not editable'],
				['children', ancestry.children.length.supressZero()],
				['parents', thing.parents.length.supressZero()],
				['relateds', thing.relatedRelationships.length.supressZero()],
			];
			properties = [
				['id', thing.id.beginWithEllipsis_forLength(17)],
				['ancestry', ancestry.id.beginWithEllipsis_forLength(19)],
				['kind', ancestry.predicate.kind],
				['type', Object.keys(T_Thing).find(k => T_Thing[k] === thing.t_thing)],
			];
			relationships = [
				['progeny', ancestry.progeny_count().supressZero()],
				['depth', ancestry.depth.supressZero()],
				['order', ancestry.order],
			];
			layout_forColor();
		}
	}

</script>

{#if !!thing}
	<div class='selection-container' 
		style='
			left:8px;
			width:100%;
			color:black;
			top:{top}px;
			height:auto;
			position:relative;
			padding-bottom:25px;
			z-index:{T_Layer.frontmost};'>
		<Text_Table
			top={0}
			row_height={11}
			bind:this={info_table}
			array={characteristics}
			name='characteristics-table'
			font_size={k.font_size.info}/>
		<Text_Table
			top={29}
			left={100}
			row_height={11}
			position='absolute'
			array={relationships}
			name='relationships-table'
			font_size={k.font_size.info}/>
		{#if !!ancestry && ancestry.isEditable}
			<Portal className='selection-color-portal'>
				<Color
					color={color}
					origin={color_origin}
					color_closure={handle_colors}
					picker_offset={picker_offset}/>
			</Portal>
		{/if}
		{#if s_details.show_properties}
			<Text_Table
				top={12}
				row_height={11}
				array={properties}
				name='properties-table'
				font_size={k.font_size.info}/>
		{/if}
	</div>
	<Separator
		has_gull_wings={true}
		has_both_wings={true}
		has_thin_divider={false}
		origin={new Point(1, 110)}
		zindex={T_Layer.frontmost + 1}
		length={k.width.details - 2.5}
		handle_click={handle_toggle_properties}
		thickness={k.thickness.separator.details}
		title='click to {s_details.show_properties ? 'hide' : 'show more'}'/>
{/if}
