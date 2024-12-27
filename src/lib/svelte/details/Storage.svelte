<script lang='ts'>
	import { k, u, Point, ZIndex, dbDispatch, Hierarchy, IDPersistent, persistLocal } from '../../ts/common/Global_Imports';
	import { s_db_type, s_db_loadTime, s_hierarchy, s_number_ofThings } from '../../ts/state/Svelte_Stores';
	import { DBType } from '../../ts/basis/PersistentIdentifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Table from '../kit/Table.svelte';
	export let top = 28;
	let information: Array<Dictionary> = [];
	let rebuilds = 0;
	
	$: {
		const _ = $s_number_ofThings;
		const h = $s_hierarchy;
		if (!!h) {
			const dict: Dictionary = {};
			if ($s_db_loadTime) {
				dict['fetch took'] = $s_db_loadTime;
			} else {
				dict['data'] = 'stored locally';
			}
			dict['things'] = h.things.length;
			information = Object.entries(dict);
			rebuilds += 1;
		}
	}

	function selection_closure(titles: Array<string>) {
		const type = titles[0] as DBType;	// only ever contains one title
		dbDispatch.db_change_toType(type);
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
	</div>
{/key}
