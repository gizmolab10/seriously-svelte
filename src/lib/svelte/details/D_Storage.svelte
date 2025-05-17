<script lang='ts'>
	import { T_Layer, T_Format, T_Storage, T_Element, T_Preference, T_ToolRequest } from '../../ts/common/Global_Imports';
	import { k, ux, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_t_database, w_hierarchy } from '../../ts/common/Stores';
	import { T_Storage } from '../../ts/common/Enumerations';
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
	const format_ids = [T_Format.csv, T_Format.json, T_Format.cancel];
	const db_ids = [T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test];
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let storage_choice: string | null = null;
	let information: Array<Dictionary> = [];
	let t_storage = T_Storage.direction;

	setup_s_elements();
	
	$: {
		const trigger = $w_storage_updated;
		const h = $w_hierarchy;
		if (!!h) {
			const dict = h.db.dict_forStorageDetails;
			dict['depth'] = h.depth;
			dict['things'] = h.things.length;
			dict['relationships'] = h.relationships.length.expressZero_asHyphen();
			information = Object.entries(dict);
		}
	}

	function selection_closure(titles: Array<string>) {
		const t_database = titles[0] as T_Database;	// only ever contains one title
		w_t_database.set(t_database);
	}
	
	function setup_s_elements() {
		const ids = [...storage_ids, ...format_ids];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, T_Element.storage, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}

	function handle_toolRequest(t_toolRequest: T_ToolRequest, s_mouse: S_Mouse, column: number): any {
		const ids = (t_storage == T_Storage.direction) ? storage_ids : format_ids;
		switch (t_toolRequest) {
			case T_ToolRequest.is_visible:	 return true;
			case T_ToolRequest.name:		 return ids[column];
			case T_ToolRequest.handle_click: return handle_click_forColumn(s_mouse, column);
			default:						 return false;
		}
		return null;
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const ids = (t_storage == T_Storage.direction) ? storage_ids : format_ids;
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isDown) {
			const choice = ids[column];
			if (t_storage == T_Storage.direction) {
				storage_choice = choice;
				t_storage = T_Storage.format;
			} else if (choice != T_Format.cancel) {
				const format = choice as T_Format;
				const h = $w_hierarchy;
				switch (storage_choice) {
					case T_Storage.export: h.persist_toFile(format); break;
					case T_Storage.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
				t_storage = T_Storage.working;
			}
		}
		return null;
	}

</script>

	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			titles={db_ids}
			selected={[$w_t_database]}
			origin={new Point(17, top + 3)}
			selection_closure={selection_closure}/>
		<div class='data-information'
			style='
				width:{k.width_details}px;
				font-size:{k.font_size.smaller}px;'>
			<Text_Table
				top={top + 26}
				row_height={11}
				array={information}
				font_size={k.font_size.small - 1}/>
		</div>
		{#key t_storage}
			{#if t_storage == T_Storage.working}
				importing...
			{:else}
				<Buttons_Row
					show_box={true}
					horizontal_gap={4}
					font_sizes={font_sizes}
					width={k.width_details}
					origin={Point.y(top + 89)}
					closure={handle_toolRequest}
					button_height={k.height.button}
					margin={(t_storage == T_Storage.direction) ? 50 : 40}
					name={`storage-${(t_storage == T_Storage.direction) ? 'action' : 'format'}`}
					row_titles={(t_storage == T_Storage.direction) ? ['local file', ...storage_ids] : ['choose a file format', ...format_ids]}/>
			{/if}
		{/key}
	</div>
