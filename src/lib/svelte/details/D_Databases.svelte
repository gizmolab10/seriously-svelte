<script lang='ts'>
	import { h, k, ux, busy, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { T_File_Format, T_File_Operation, T_Storage_Need, T_Signal } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Element, T_Preference, T_Request } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { T_Database } from '../../ts/database/DBCommon';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import { w_t_database } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	import Spinner from '../kit/Spinner.svelte';
	export let top = 0;
	const buttons_top = 138;
	const border = '1px solid black';
    const font_sizes = [k.font_size.smallest, k.font_size.smaller];
	const storage_ids = [T_File_Operation.import, T_File_Operation.export];
	const format_ids = [T_File_Format.csv, T_File_Format.json, T_File_Format.cancel];
	const es_save = ux.s_element_for(new Identifiable('save'), T_Element.button, 'save');
	const db_ids = [T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test];
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let storage_choice: string | null = null;
	let storage_details: Array<Object> = [];

	setup_s_elements();
	es_save.set_forHovering('black', 'pointer');

	$: $w_storage_updated, $w_t_database, update_storage_details();

	function update_storage_details() {
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

	function row_titles() {
		switch (ux.T_Storage_Need) {
			case T_Storage_Need.direction: return ['from or to a local file', ...storage_ids];
			case T_Storage_Need.format:	   return ['choose a file format', ...format_ids];
			case T_Storage_Need.busy:	   return [`${storage_choice}ing...`];
		}
	}
	
	function setup_s_elements() {
		const ids = [...storage_ids, ...format_ids];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, T_Element.database, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}

	function handle_db_selection(titles: string[]) {
		const t_database = titles[0] as T_Database;	// only ever contains one title
		databases.grand_change_database(t_database);
	}

	async function handle_save(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isUp) {
			await h.db.persist_all(true);
		}
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = (ux.T_Storage_Need == T_Storage_Need.direction) ? storage_ids : format_ids;
		switch (t_request) {
			case T_Request.handle_click: return handle_click_forColumn(s_mouse, column);
			case T_Request.name:		 return ids[column];
			case T_Request.is_visible:   return true;
			default:					 return false;
		}
		return null;
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const ids = (ux.T_Storage_Need == T_Storage_Need.direction) ? storage_ids : format_ids;
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isDown) {
			const choice = ids[column];
			if (choice == T_File_Format.cancel) {
				ux.T_Storage_Need = T_Storage_Need.direction;
			} else if (ux.T_Storage_Need == T_Storage_Need.direction) {
				storage_choice = choice;
				ux.T_Storage_Need = T_Storage_Need.format;
			} else {
				const format = choice as T_File_Format;
				switch (storage_choice) {
					case T_File_Operation.export: h.persist_toFile(format); break;
					case T_File_Operation.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
				ux.T_Storage_Need = T_Storage_Need.busy;
			}
		}
		return null;
	}

</script>

<div class='data-details'
	style='
		height:40px;
		padding:5px;'>
	<Segmented
		name='db'
		titles={db_ids}
		width={k.width_details - 7}
		selected={[$w_t_database]}
		height={k.height.controls}
		origin={new Point(0, top - 2)}
		handle_selection={handle_db_selection}/>
	<div class='data-details'
		style='
			width: 100%;
			font-size:{k.font_size.smaller}px;'>
		<Text_Table
			top={top + 22}
			row_height={11}
			name='data-table'
			array={storage_details}
			font_size={k.font_size.small - 1}/>
		{#key $w_storage_updated}
			{#if h.total_dirty_count != 0}
				{#if busy.isDatabaseBusy}
					<div class='data-spinner'
						style="position: absolute; left: 163px; top: 107px;">
						<Spinner />
					</div>
				{:else if h.db.isPersistent}
					<Button
						width=72
						name='save'
						border={border}
						es_button={es_save}
						closure={handle_save}
						zindex={T_Layer.frontmost}
						origin={new Point(32, top + 102)}>
						save to db
					</Button>
				{/if}
			{/if}
		{/key}
	</div>
	{#key ux.T_Storage_Need}
		<Buttons_Row
			gap={4}
			margin={60}
			has_seperator={true}
			font_sizes={font_sizes}
			width={k.width_details}
			row_titles={row_titles()}
			origin={Point.y(top + 132)}
			closure={handle_actionRequest}
			button_height={k.height.button}
			separator_thickness={k.thickness.separator.ultra_thin}
			name={`data-${(ux.T_Storage_Need == T_Storage_Need.direction) ? 'action' : 'format'}`}/>
	{/key}
</div>
