<script lang='ts'>
	import { h, k, u, ux, busy, Point, colors, S_Element, databases, Hierarchy } from '../../ts/common/Global_Imports';
	import { T_File_Format, T_File_Operation, T_Storage_Need, T_Signal } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Details, T_Element, T_Preference, T_Request } from '../../ts/common/Global_Imports';
	import { w_data_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { T_Database } from '../../ts/database/DB_Common';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import { w_t_database } from '../../ts/common/Stores';
    import { s_details } from '../../ts/state/S_Details';
	import Text_Table from '../text/Text_Table.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	import Spinner from '../draw/Spinner.svelte';
    const font_sizes = [k.font_size.instructions, k.font_size.banners];
	const ids_forDirection = [T_File_Operation.import, T_File_Operation.export];
	const es_save = ux.s_element_for(new Identifiable('save'), T_Element.button, 'save');
	const ids_forOutputFormat = [T_File_Format.csv, T_File_Format.json, T_File_Format.cancel];
	const ids_forDatabase = [T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test, T_Database.bubble];
	const ids_forInputFormat = [T_File_Format.csv, T_File_Format.json, T_File_Format.seriously, T_File_Format.cancel];
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let show_databases = $w_t_database != T_Database.bubble;
	let heights = [13, height_ofChoices(), 42, 28, 74, 26, 3];
	let storage_choice: string | null = null;
	let storage_details: Array<Object> = [];
	let width = k.width.details - 7;
	let show_save_button = false;
	let spinnerAngle = 0;
	let title = k.empty;

	setup_s_elements();
	$: tops = u.cumulativeSum(heights);
	es_save.set_forHovering('black', 'pointer');
	function height_ofChoices() { return show_databases ? 22 : -4; }
	function handle_spinner_angle(event) { spinnerAngle = event.detail.angle; }

	$:{
		const _ = $w_data_updated + $w_t_database;
		update_storage_details();
	}

	function ids_forFormat(): T_File_Format[] {
		return (storage_choice == T_File_Operation.import) ? ids_forInputFormat : ids_forOutputFormat;
	}

	function handle_db_selection(titles: string[]) {
		const t_database = titles[0] as T_Database; // only ever contains one title
		databases.grand_change_database(t_database);
	}

	async function handle_save(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isUp) {
			await h.db.persist_all(true);
		}
	}

	function handle_toggle_databases(event: Event) {
		show_databases = !show_databases;
		heights[1] = height_ofChoices();
		heights = [...heights];
	}

	function action_titles() {
		switch (s_details.t_storage_need) {
			case T_Storage_Need.direction: return ['local file', ...ids_forDirection];
			case T_Storage_Need.format:    return ['file type', ...ids_forFormat()];
			case T_Storage_Need.busy:      return [`${storage_choice}ing...`];
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
		const ids = (s_details.t_storage_need == T_Storage_Need.direction) ? ids_forDirection : ids_forFormat();
		switch (t_request) {
			case T_Request.handle_click: return handle_click_forColumn(s_mouse, column);
			case T_Request.name:        return ids[column];
			case T_Request.is_visible:  return true;
			default:                    return false;
		}
		return null;
	}

	function update_storage_details() {
		if (!!h) {
			show_save_button = h.db.isPersistent && h.total_dirty_count != 0;
			storage_details = [h.db.details_forStorage,
			['depth', h.depth.supressZero()],
			['things', h.things.length.supressZero()],
			['relationships', h.relationships.length.supressZero()],
			['traits', h.traits.length.supressZero()],
			['tags', h.tags.length.supressZero()],
			['must save', h.total_dirty_count.supressZero()]];
		}
	}
	
	function handle_click_forColumn(s_mouse, column) {
		const beginning = s_details.t_storage_need == T_Storage_Need.direction;
		const ids = beginning ? ids_forDirection : ids_forFormat();
		if (s_mouse.isHover) {
			s_element_byStorageType[ids[column]].isOut = s_mouse.isOut;
		} else if (s_mouse.isDown) {
			const choice = ids[column];
			s_details.t_storage_need = T_Storage_Need.direction; // reset by default
			if (beginning) {
				storage_choice = choice;
				s_details.t_storage_need = T_Storage_Need.format; // not reset
			} else if (choice != T_File_Format.cancel) {
				const format = choice as T_File_Format;
				switch (storage_choice) {
					case T_File_Operation.export: h.persist_toFile(format); break;
					case T_File_Operation.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
			}
		}
	}

</script>

<div class='database-container'
	style='
		padding:5px;'>
	<Separator
		has_gull_wings={true}
		has_both_wings={true}
		has_thin_divider={false}
		origin={new Point(1, 30)}
		zindex={T_Layer.frontmost + 1}
		length={k.width.details - 2.5}
		handle_click={handle_toggle_databases}
		thickness={k.thickness.separator.details}
		title='{show_databases ? 'hide other databases' : 'show other databases'}'/>
	{#if show_databases}
		<Segmented
			name='db'
			width={width}
			titles={ids_forDatabase}
			selected={[$w_t_database]}
			height={k.height.controls}
			origin={new Point(0, tops[0])}
			handle_selection={handle_db_selection}/>
	{/if}
	<div class='database-information'
		style='
			width: 100%;
			top={tops[1]}
			position: relative;
			font-size:{k.font_size.banners}px;'>
		<Text_Table
			top={tops[1]}
			row_height={11}
			name='database-table'
			array={storage_details}
			font_size={k.font_size.banners}/>
		{#key $w_data_updated}
			{#if busy.isDatabaseBusy && h.db.isPersistent}
				<div class='data-spinner'
					style='
						left: 120px;
						opacity: 0.5;
						top: {tops[2]}px;
						position: absolute;'>
					<Spinner
						speed='3s'
						diameter={72}
						strokeWidth={8}
						angle={spinnerAngle}
						number_of_dashes={9}
						stroke={colors.separator}
						on:angle={handle_spinner_angle}/>
				</div>
			{:else if show_save_button}
				<Button
					width=72
					name='save'
					es_button={es_save}
					closure={handle_save}
					zindex={T_Layer.frontmost}
					origin={new Point(120, tops[3])}>
					save to db
				</Button>
			{/if}
		{/key}
	</div>
	{#key s_details.t_storage_need, show_databases}
		<Buttons_Row
			gap={4}
			margin={20}
			width={width + 5}
			has_seperator={true}
			font_sizes={font_sizes}
			row_titles={action_titles()}
			closure={handle_actionRequest}
			button_height={k.height.button}
			center={new Point(width / 2 + 3, tops[4])}
			separator_thickness={k.thickness.separator.details}
			name={`data-${(s_details.t_storage_need == T_Storage_Need.direction) ? 'action' : 'format'}`}/>
	{/key}
	<Separator
		isHorizontal={true}
		length={k.width.details + 1.5}
		origin={new Point(-0.6, tops[5])}
		thickness={k.thickness.separator.main}
		corner_radius={k.radius.gull_wings.thick}/>
</div>
