<script lang='ts'>
	import { k, u, ux, Point, ZIndex, databases, Hierarchy, T_Storage } from '../../ts/common/Global_Imports';
	import { T_Element, S_Element, T_Preference, preferences } from '../../ts/common/Global_Imports';
	import { s_storage_update_trigger, s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { s_type_db, s_hierarchy } from '../../ts/state/S_Stores';
	import { T_Database } from '../../ts/data/dbs/DBCommon';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	export let top = 28;
	const buttons_top = 138;
	const button_style = `font-family: ${$s_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let element_states_byID: { [id: string]: S_Element } = {};
	let information: Array<Dictionary> = [];
	let rebuilds = 0;

	setup_element_states();
	
	$: {
		const _ = $s_storage_update_trigger;
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
		const type = titles[0] as T_Database;	// only ever contains one title
		databases.db_change_toType(type);
	}
	
	function setup_element_states() {
		const ids = [T_Storage.export, T_Storage.import];
		for (const id of ids) {
			const element_state = ux.element_state_for(null, T_Element.storage, id);
			element_state.set_forHovering('black', 'pointer');
			element_state.color_background = k.color_background;
			element_states_byID[id] = element_state;
		}
	}
	
	function button_closure_forID(mouse_state, idStorage) {
		if (mouse_state.isHover) {
			element_states_byID[idStorage].isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			const h = $s_hierarchy;
			switch (idStorage) {
				case T_Storage.export: h.persist_toFile(); break;
				case T_Storage.import: h.select_file_toUpload(mouse_state.event.shiftKey); break;
			}
		}
	}

</script>

{#key $s_type_db, rebuilds}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			selected={[$s_type_db]}
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
			zindex=ZIndex.frontmost
			center={new Point(74, buttons_top)}
			height={k.default_buttonSize - 4}
			element_state={element_states_byID[T_Storage.import]}
			closure={(mouse_state) => button_closure_forID(mouse_state, T_Storage.import)}>
			<span style={button_style}>import</span>
		</Button>
		<Button name='export'
			width=42
			zindex=ZIndex.frontmost
			center={new Point(122, buttons_top)}
			height={k.default_buttonSize - 4}
			element_state={element_states_byID[T_Storage.export]}
			closure={(mouse_state) => button_closure_forID(mouse_state, T_Storage.export)}>
			<span style={button_style}>export</span>
		</Button>
	</div>
{/key}
