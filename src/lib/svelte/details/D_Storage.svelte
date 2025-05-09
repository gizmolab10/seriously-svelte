<script lang='ts'>
	import { k, ux, Point, colors, S_Element, databases, Hierarchy, E_Storage } from '../../ts/common/Global_Imports';
	import { E_Layer, E_Element, E_Preference } from '../../ts/common/Global_Imports';
	import { w_storage_updated, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_e_database, w_hierarchy } from '../../ts/common/Stores';
	import { E_Database } from '../../ts/database/DBCommon';
	import Segmented from '../mouse/Segmented.svelte';
	import Text_Table from '../kit/Text_Table.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const buttons_top = 138;
	const button_style = `font-family: ${$w_thing_fontFamily}; font-size:0.85em; left: 5px; top: -2px; position: absolute;`;
	let s_element_byStorageType: { [id: string]: S_Element } = {};
	let information: Array<Dictionary> = [];

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
		const ids = [E_Storage.export, E_Storage.import];
		for (const id of ids) {
			const es_storage = ux.s_element_for(null, E_Element.storage, id);
			es_storage.set_forHovering(colors.default, 'pointer');
			s_element_byStorageType[id] = es_storage;
		}
	}
	
	function button_closure_forStorage_Type(s_mouse, e_storage) {
		if (s_mouse.isHover) {
			s_element_byStorageType[e_storage].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			const h = $w_hierarchy;
			switch (e_storage) {
				case E_Storage.export: h.persist_toFile(); break;
				case E_Storage.import: h.select_file_toUpload(s_mouse.event.shiftKey); break;
			}
		}
	}

</script>

	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			selected={[$w_e_database]}
			origin={new Point(17, top + 3)}
			selection_closure={selection_closure}
			titles={[E_Database.local, E_Database.firebase, E_Database.airtable, E_Database.test]}/>
		<div class='data-information'
			style='
				width:{k.width_details}px;
				font-size:{k.font_size.smaller}px;'>
			<Text_Table
				top={top + 23}
				row_height={11}
				array={information}
				font_size={k.font_size.small - 1}/>
		</div>
		<Separator
			top={buttons_top - 15}
			add_wings={true}
			width={k.width_details}
			margin={k.details_margin}
			title='local file'
			thickness={k.thickness.thin}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.smallest}/>
		<Button name='import'
			width=42
			zindex=E_Layer.frontmost
			height={k.height.button - 4}
			center={new Point(74, buttons_top)}
			es_button={s_element_byStorageType[E_Storage.import]}
			closure={(s_mouse) => button_closure_forStorage_Type(s_mouse, E_Storage.import)}>
			<span style={button_style}>import</span>
		</Button>
		<Button name='export'
			width=42
			zindex=E_Layer.frontmost
			height={k.height.button - 4}
			center={new Point(122, buttons_top)}
			es_button={s_element_byStorageType[E_Storage.export]}
			closure={(s_mouse) => button_closure_forStorage_Type(s_mouse, E_Storage.export)}>
			<span style={button_style}>export</span>
		</Button>
	</div>
