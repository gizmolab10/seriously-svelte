<script lang='ts'>
	import { T_Layer, T_File, T_Storage, T_Element, T_Preference, T_Request } from '../../ts/common/Global_Imports';
	import { k, ux, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_t_database, w_hierarchy } from '../../ts/common/Stores';
	import { T_Database } from '../../ts/database/DBCommon';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const buttons_top = 138;
	const storage_ids = [T_Storage.import, T_Storage.export];
    const font_sizes = [k.font_size.smallest, k.font_size.smaller];
	const format_ids = [T_File.csv, T_File.json, T_File.cancel];
	const db_ids = [T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test];
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let storage_choice: string | null = null;
	let storage_details: Array<Object> = [];

	setup_s_elements();
	
	$: {
		const trigger = $w_storage_updated;
		const h = $w_hierarchy;
		if (!!h) {
			storage_details = [h.db.details_forStorage,
			['depth', h.depth.expressZero_asHyphen()],
			['things', h.things.length.expressZero_asHyphen()],
			['relationships', h.relationships.length.expressZero_asHyphen()],
			['traits', h.traits.length.expressZero_asHyphen()],
			['tags', h.tags.length.expressZero_asHyphen()],
			['dirty', h.total_dirty_count.expressZero_asHyphen()]];
		}
	}

	function selection_closure(titles: Array<string>) {
		const t_database = titles[0] as T_Database;	// only ever contains one title
		w_t_database.set(t_database);
	}

	function row_titles() {
		switch (ux.t_storage) {
			case T_Storage.direction: return ['local file', ...storage_ids];
			case T_Storage.format: return ['choose a file format', ...format_ids];
			case T_Storage.working: return [`${storage_choice}ing...`];
		}
	}
	
	function setup_s_elements() {
		const ids = [...storage_ids, ...format_ids];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, T_Element.storage, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}

	function handle_toolRequest(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = (ux.t_storage == T_Storage.direction) ? storage_ids : format_ids;
		switch (t_request) {
			case T_Request.is_visible:   return true;
			case T_Request.name:		   return ids[column];
			case T_Request.handle_click: return handle_click_forColumn(s_mouse, column);
			default:						   return false;
		}
		return null;
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const ids = (ux.t_storage == T_Storage.direction) ? storage_ids : format_ids;
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isDown) {
			const choice = ids[column];
			if (choice == T_File.cancel) {
				ux.t_storage = T_Storage.direction;
			} else if (ux.t_storage == T_Storage.direction) {
				storage_choice = choice;
				ux.t_storage = T_Storage.format;
			} else {
				const format = choice as T_File;
				const h = $w_hierarchy;
				switch (storage_choice) {
					case T_Storage.export: h.persist_toFile(format); break;
					case T_Storage.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
				ux.t_storage = T_Storage.working;
			}
		}
		return null;
	}

</script>

<div class='storage-details'
	style='
		height:40px;
		padding:5px;'>
	<Segmented
		name='db'
		titles={db_ids}
		selected={[$w_t_database]}
		height={k.height.controls}
		origin={new Point(22, top + 3)}
		selection_closure={selection_closure}/>
	<div class='data-details'
		style='
			width: 100%;
			font-size:{k.font_size.smaller}px;'>
		<Text_Table
			top={top + 21}
			row_height={11}
			array={storage_details}
			font_size={k.font_size.small - 1}/>
	</div>
	{#key ux.t_storage}
		<Buttons_Row
			show_box={true}
			horizontal_gap={4}
			font_sizes={font_sizes}
			width={k.width_details}
			row_titles={row_titles()}
			origin={Point.y(top + 129)}
			closure={handle_toolRequest}
			button_height={k.height.button}
			margin={(ux.t_storage == T_Storage.direction) ? 50 : 40}
			name={`storage-${(ux.t_storage == T_Storage.direction) ? 'action' : 'format'}`}/>
	{/key}
</div>
