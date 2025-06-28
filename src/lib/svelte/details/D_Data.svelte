<script lang='ts'>
	import { h, k, ux, busy, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { T_File_Format, T_File_Operation, T_Storage_Need, T_Signal } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Details, T_Element, T_Preference, T_Request } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { T_Database } from '../../ts/database/DB_Common';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import { w_t_database } from '../../ts/common/Stores';
    import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	import Spinner from '../kit/Spinner.svelte';
	export let top = 3;
	const buttons_top = 138;
    const font_sizes = [k.font_size.instructions, k.font_size.banners];
	const ids_forDirection = [T_File_Operation.import, T_File_Operation.export];
    const s_banner_hideable = s_details.s_banner_hideables_byType[T_Details.database];
	const es_save = ux.s_element_for(new Identifiable('save'), T_Element.button, 'save');
	const ids_forOutputFormat = [T_File_Format.csv, T_File_Format.json, T_File_Format.cancel];
	const ids_forDatabase = [T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test];
	const ids_forInputFormat = [T_File_Format.csv, T_File_Format.json, T_File_Format.seriously, T_File_Format.cancel];
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let storage_choice: string | null = null;
	let storage_details: Array<Object> = [];
	let width = k.width_details - 7;
	let isDirty = false;

	setup_s_elements();
	es_save.set_forHovering('black', 'pointer');

	$: {
		const _ = $w_storage_updated + $w_t_database;
		update_storage_details();
	}

	function ids_forFormat(): T_File_Format[] {
		return (ux.T_Storage_Need == T_Storage_Need.format) ? ids_forInputFormat : ids_forOutputFormat;
	}

	async function handle_save(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isUp) {
			await h.db.persist_all(true);
		}
	}

	function handle_db_selection(titles: string[]) {
		const t_database = titles[0] as T_Database;		// only ever contains one title
		databases.grand_change_database(t_database);
	}

	function action_titles() {
		switch (ux.T_Storage_Need) {
			case T_Storage_Need.direction: return ['local file', ...ids_forDirection];
			case T_Storage_Need.format:	   return ['file type', ...ids_forFormat()];
			case T_Storage_Need.busy:	   return [`${storage_choice}ing...`];
		}
	}
	
	function setup_s_elements() {
		const ids = [...ids_forDirection, ...ids_forInputFormat];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, T_Element.database, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = (ux.T_Storage_Need == T_Storage_Need.direction) ? ids_forDirection : ids_forFormat();
		switch (t_request) {
			case T_Request.handle_click: return handle_click_forColumn(s_mouse, column);
			case T_Request.name:		 return ids[column];
			case T_Request.is_visible:   return true;
			default:					 return false;
		}
		return null;
	}

	function update_storage_details() {
		if (!!h) {
			isDirty = h.total_dirty_count != 0;
			storage_details = [h.db.details_forStorage,
			['depth', h.depth.supressZero()],
			['things', h.things.length.supressZero()],
			['relationships', h.relationships.length.supressZero()],
			['traits', h.traits.length.supressZero()],
			['tags', h.tags.length.supressZero()],
			['dirty', h.total_dirty_count.supressZero()]];
		}
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const ids = (ux.T_Storage_Need == T_Storage_Need.direction) ? ids_forDirection : ids_forFormat();
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isDown) {
			console.log('click', ids[column]);
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
	}

</script>

<div class='database-container'
	style='
		padding:5px;'>
	<Segmented
		name='db'
		width={width}
		titles={ids_forDatabase}
		selected={[$w_t_database]}
		height={k.height.controls}
		origin={new Point(0, top)}
		handle_selection={handle_db_selection}/>
	<div class='database-information'
		style='
			width: 100%;
			font-size:{k.font_size.banners}px;'>
		<Text_Table
			top={top + 19}
			row_height={11}
			name='database-table'
			array={storage_details}
			font_size={k.font_size.banners}/>
		{#key $w_storage_updated}
			{#if busy.isDatabaseBusy}
				<div class='data-spinner'
					style="position: absolute; left: 120px; top: 72px;">
					<Spinner size={72} stroke='lightgray' strokeWidth={8} speed='2s' />
				</div>
			{:else if isDirty && h.db.isPersistent}
				<Button
					width=72
					name='save'
					es_button={es_save}
					closure={handle_save}
					zindex={T_Layer.frontmost}
					origin={new Point(120, 92)}>
					save to db
				</Button>
			{/if}
		{/key}
	</div>
	{#key ux.T_Storage_Need}
		<Buttons_Row
			gap={4}
			margin={20}
			width={width + 6}
			has_seperator={true}
			font_sizes={font_sizes}
			row_titles={action_titles()}
			closure={handle_actionRequest}
			button_height={k.height.button}
			center={new Point(width / 2 + 3, top + 160)}
			separator_thickness={k.thickness.separator.ultra_thin}
			name={`data-${(ux.T_Storage_Need == T_Storage_Need.direction) ? 'action' : 'format'}`}/>
	{/key}
	<Separator
		isHorizontal={true}
		origin={Point.y(top + 189)}
		thickness={k.thickness.separator.thick}
		corner_radius={k.radius.gull_wings.thick}/>
</div>
