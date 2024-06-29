<script lang='ts'>
	import { k, u, ZIndex, dbDispatch, Hierarchy, IDPersistant, persistLocal } from '../../ts/common/Global_Imports';
	import Radio_Buttons from '../buttons/Radio_Buttons.svelte';
	import { s_db_type } from '../../ts/state/Reactive_State';
	import { DBType } from '../../ts/db/DBInterface';
	import { h } from '../../ts/db/DBDispatch';

	function handle_dbTypeAt(index) { dbDispatch.db_change_toType(menuItems[index].id); }

	const menuItems = [
		{ id: DBType.local,	   label: 'local', action: () => { handle_dbTypeAt(0); } },
		{ id: DBType.firebase, label: 'firebase', action: () => { handle_dbTypeAt(1); } },
		{ id: DBType.airtable, label: 'airtable', action: () => { handle_dbTypeAt(2); } }
	];

</script>

<Radio_Buttons menuItems={menuItems} idSelected={$s_db_type} fitWithin={k.width_details}/>
