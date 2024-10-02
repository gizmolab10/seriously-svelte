<script lang='ts'>
	import { k, u, ZIndex, dbDispatch, Hierarchy, IDPersistent, persistLocal } from '../../ts/common/Global_Imports';
	import { s_db_type, s_db_loadTime } from '../../ts/state/Reactive_State';
	import Radio_Buttons from '../buttons/Radio_Buttons.svelte';
	import { DBType } from '../../ts/db/DBInterface';
	import { h } from '../../ts/db/DBDispatch';

	function handle_dbTypeAt(index) { dbDispatch.db_change_toType(menuItems[index].id); }

	const menuItems = [
		{ id: DBType.local,	   label: 'local', action: () => { handle_dbTypeAt(0); } },
		{ id: DBType.firebase, label: 'firebase', action: () => { handle_dbTypeAt(1); } },
		{ id: DBType.airtable, label: 'airtable', action: () => { handle_dbTypeAt(2); } }
	];

</script>

{#key $s_db_type}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;
			justify-content:center;'>
		<Radio_Buttons name='storage' menuItems={menuItems} idSelected={$s_db_type}/>
		{#if $s_db_loadTime && $s_db_loadTime > 0}
			<div style='
				top:24px;
				left:60px;
				color:#333;
				font-size:11px;
				position:absolute;'>
				fetch took {$s_db_loadTime} s
			</div>
		{/if}
	</div>
{/key}
