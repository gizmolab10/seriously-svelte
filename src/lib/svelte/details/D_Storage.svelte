<script lang='ts'>
	import { k, ux, Point, S_Element, databases, Hierarchy, T_Storage } from '../../ts/common/Global_Imports';
	import { w_storage_update_trigger, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, T_Element, T_Preference } from '../../ts/common/Global_Imports';
	import { w_t_database, w_hierarchy } from '../../ts/common/Stores';
	import { T_Database } from '../../ts/data/dbs/DBCommon';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	export let top = 0;
	const buttons_top = 133;
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let information: Array<Dictionary> = [];
	let storage_rebuilds = 0;

	setup_s_elements();
	
	$: {
		const trigger = $w_storage_update_trigger;
		const h = $w_hierarchy;
		if (!!h) {
			const dict = h.db.dict_forStorageDetails;
			dict['depth'] = h.depth;
			dict['things'] = h.things.length;
			dict['relationships'] = h.relationships.length.expressZero_asHyphen();
			information = Object.entries(dict);
			storage_rebuilds += 1;
		}
	}

	function selection_closure(titles: Array<string>) {
		const t_database = titles[0] as T_Database;	// only ever contains one title
		w_t_database.set(t_database);
	}
	
	function setup_s_elements() {
		const ids = [T_Storage.export, T_Storage.import];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, T_Element.storage, id);
			es_storage.set_forHovering('black', 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}
	
	function button_closure_forStorage_Type(s_mouse, t_storage) {
		if (s_mouse.isHover) {
			s_element_byStorageType[t_storage].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			const h = $w_hierarchy;
			switch (t_storage) {
				case T_Storage.export: h.persist_toFile(); break;
				case T_Storage.import: h.select_file_toUpload(s_mouse.event.shiftKey); break;
			}
		}
	}

</script>

{#key $w_t_database, storage_rebuilds}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			selected={[$w_t_database]}
			origin={new Point(4, top)}
			selection_closure={selection_closure}
			titles={[T_Database.local, T_Database.firebase, T_Database.airtable, T_Database.test]}/>
		<div class='data-information'
			style='font-size:0.8em;
				width:{k.width_details}px;'>
			<Table top={top + 22} array={information}/>
		</div>
		<Button name='import'
			width=42
			zindex=T_Layer.frontmost
			center={new Point(74, buttons_top)}
			height={k.default_buttonSize - 4}
			es_button={s_element_byStorageType[T_Storage.import]}
			closure={(s_mouse) => button_closure_forStorage_Type(s_mouse, T_Storage.import)}>
			<span style={button_style}>import</span>
		</Button>
		<Button name='export'
			width=42
			zindex=T_Layer.frontmost
			center={new Point(122, buttons_top)}
			height={k.default_buttonSize - 4}
			es_button={s_element_byStorageType[T_Storage.export]}
			closure={(s_mouse) => button_closure_forStorage_Type(s_mouse, T_Storage.export)}>
			<span style={button_style}>export</span>
		</Button>
	</div>
{/key}
