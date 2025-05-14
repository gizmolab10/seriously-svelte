<script lang='ts'>
	import { E_Layer, E_Format, E_Storage, E_Element, E_Preference, E_ToolRequest } from '../../ts/common/Global_Imports';
	import { k, ux, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_e_database, w_hierarchy } from '../../ts/common/Stores';
	import { E_Database } from '../../ts/database/DBCommon';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const buttons_top = 138;
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	const db_ids = [E_Database.local, E_Database.firebase, E_Database.airtable, E_Database.test];
	const format_ids = [E_Format.csv, E_Format.json, E_Format.cancel];
    const font_sizes = [k.font_size.smallest, k.font_size.smaller];
	const storage_ids = [E_Storage.import, E_Storage.export];
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let storage_choice: string | null = null;
	let information: Array<Dictionary> = [];
	let choosing_storage = true;

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
		const e_database = titles[0] as E_Database;	// only ever contains one title
		w_e_database.set(e_database);
	}
	
	function setup_s_elements() {
		const ids = [...storage_ids, ...format_ids];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, E_Element.storage, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}

	function handle_toolRequest(e_toolRequest: E_ToolRequest, s_mouse: S_Mouse, column: number): any {
		const ids = choosing_storage ? storage_ids : format_ids;
		switch (e_toolRequest) {
			case E_ToolRequest.is_visible:	 return true;
			case E_ToolRequest.name:		 return ids[column];
			case E_ToolRequest.handle_click: return handle_click_forColumn(s_mouse, column);
			default:						 return false;
		}
		return null;
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const ids = choosing_storage ? storage_ids : format_ids;
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			const choice = ids[column];
			if (choosing_storage) {
				storage_choice = choice;
			} else if (choice != E_Format.cancel) {
				const format = choice as E_Format;
				const h = $w_hierarchy;
				switch (storage_choice) {
					case E_Storage.export: h.persist_toFile(format); break;
					case E_Storage.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
			}
			choosing_storage = !choosing_storage;
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
			selected={[$w_e_database]}
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
		{#key choosing_storage}
			<Buttons_Row
				show_box={true}
				horizontal_gap={4}
				font_sizes={font_sizes}
				width={k.width_details}
				origin={Point.y(top + 89)}
				closure={handle_toolRequest}
				button_height={k.height.button}
				margin={choosing_storage ? 50 : 40}
				name={`storage-${choosing_storage ? 'action' : 'format'}`}
				row_titles={choosing_storage ? ['local file', ...storage_ids] : ['choose a file format', ...format_ids]}/>
		{/key}
	</div>
