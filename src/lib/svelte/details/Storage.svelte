<script lang='ts'>
	import { k, u, ux, Point, ZIndex, dbDispatch, Hierarchy, IDStorage } from '../../ts/common/Global_Imports';
	import { ElementType, Element_State, IDPersistent, persistLocal } from '../../ts/common/Global_Imports';
	import { s_db_type, s_db_loadTime, s_hierarchy } from '../../ts/state/Svelte_Stores';
	import { s_number_ofThings, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { DBType } from '../../ts/basis/PersistentIdentifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import Table from '../kit/Table.svelte';
	export let top = 28;
	const button_style = `font-family: ${$s_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let element_states_byID: { [id: string]: Element_State } = {};
	let information: Array<Dictionary> = [];
	let rebuilds = 0;

	setup_element_states();
	
	$: {
		const _ = $s_number_ofThings;
		const h = $s_hierarchy;
		if (!!h) {
			const dict: Dictionary = {};
			if (!!$s_db_loadTime) {
				dict['fetch took'] = $s_db_loadTime;
			} else {
				dict['data'] = 'stored locally';
			}
			dict['depth'] = h.depth;
			dict['things'] = h.things.length;
			dict['relationships'] = h.relationships.length;
			information = Object.entries(dict);
			rebuilds += 1;
		}
	}

	function selection_closure(titles: Array<string>) {
		const type = titles[0] as DBType;	// only ever contains one title
		dbDispatch.db_change_toType(type);
	}
	
	function setup_element_states() {
		const ids = [IDStorage.export, IDStorage.import];
		for (const id of ids) {
			const element_state = ux.element_state_for(null, ElementType.storage, id);
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
				case IDStorage.export: h.save_toFile(); break;
				case IDStorage.import: h.select_file_toUpload(mouse_state.event.shiftKey); break;
			}
		}
	}

</script>

{#key $s_db_type, rebuilds}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			selected={[$s_db_type]}
			origin={new Point(4, top)}
			selection_closure={selection_closure}
			titles={[DBType.local, DBType.firebase, DBType.airtable, DBType.test]}/>
		<div class='data-information'
			style='font-size:0.8em;
				width:{k.width_details}px;'>
			<Table top={top + 20} array={information}/>
		</div>
		<Button name='import'
			width=42
			zindex=ZIndex.frontmost
			center={new Point(74, 135)}
			height={k.default_buttonSize - 4}
			element_state={element_states_byID[IDStorage.import]}
			closure={(mouse_state) => button_closure_forID(mouse_state, IDStorage.import)}>
			<span style={button_style}>import</span>
		</Button>
		<Button name='export'
			width=42
			zindex=ZIndex.frontmost
			center={new Point(122, 135)}
			height={k.default_buttonSize - 4}
			element_state={element_states_byID[IDStorage.export]}
			closure={(mouse_state) => button_closure_forID(mouse_state, IDStorage.export)}>
			<span style={button_style}>export</span>
		</Button>
	</div>
{/key}
