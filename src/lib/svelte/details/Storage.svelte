<script lang='ts'>
	import { k, u, ux, Point, T_Layer, databases, Hierarchy, T_Storage } from '../../ts/common/Global_Imports';
	import { T_Element, S_Element, T_Preference, preferences } from '../../ts/common/Global_Imports';
	import { s_storage_update_trigger, s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { s_t_database, s_hierarchy } from '../../ts/state/S_Stores';
	import { T_Database } from '../../ts/data/dbs/DBCommon';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	export let top = 28;
	const buttons_top = 138;
	const button_style = `font-family: ${$s_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_elements_byT_Storage: { [id: string]: S_Element } = {};
	let information: Array<Dictionary> = [];
	let rebuilds = 0;

	setup_s_elements();
	
	$: {
		const trigger = $s_storage_update_trigger;
		const h = $s_hierarchy;
		if (!!h) {
			const dict = h.db.dict_forStorageDetails;
			dict['depth'] = h.depth;
			dict['things'] = h.things.length;
			dict['relationships'] = h.relationships.length.expressZero_asHyphen();
			information = Object.entries(dict);
			rebuilds += 1;
		}
	}

	function selection_closure(titles: Array<string>) {
		const t_database = titles[0] as T_Database;	// only ever contains one title
		databases.db_change_toType(t_database);
	}
	
	function setup_s_elements() {
		const ids = [T_Storage.export, T_Storage.import];
		for (const id of ids) {
			const s_element = ux.s_element_for(null, T_Element.storage, id);
			s_element.set_forHovering('black', 'pointer');
			s_element.color_background = k.color_background;
			s_elements_byT_Storage[id] = s_element;
		}
	}
	
	function button_closure_forT_Storage(mouse_state, t_storage) {
		if (mouse_state.isHover) {
			s_elements_byT_Storage[t_storage].isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const h = $s_hierarchy;
			switch (t_storage) {
				case T_Storage.export: h.persist_toFile(); break;
				case T_Storage.import: h.select_file_toUpload(mouse_state.event.shiftKey); break;
			}
		}
	}

</script>

{#key $s_t_database, rebuilds}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			selected={[$s_t_database]}
			origin={new Point(4, top)}
			selection_closure={selection_closure}
			titles={[T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test]}/>
		<div class='data-information'
			style='font-size:0.8em;
				width:{k.width_details}px;'>
			<Table top={top + 20} array={information}/>
		</div>
		<Button name='import'
			width=42
			zindex=T_Layer.frontmost
			center={new Point(74, buttons_top)}
			height={k.default_buttonSize - 4}
			s_element={s_elements_byT_Storage[T_Storage.import]}
			closure={(mouse_state) => button_closure_forT_Storage(mouse_state, T_Storage.import)}>
			<span style={button_style}>import</span>
		</Button>
		<Button name='export'
			width=42
			zindex=T_Layer.frontmost
			center={new Point(122, buttons_top)}
			height={k.default_buttonSize - 4}
			s_element={s_elements_byT_Storage[T_Storage.export]}
			closure={(mouse_state) => button_closure_forT_Storage(mouse_state, T_Storage.export)}>
			<span style={button_style}>export</span>
		</Button>
	</div>
{/key}
