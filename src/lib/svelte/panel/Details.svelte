<script>
	import { k, u, DBType, ZIndex, IDPersistant, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports';
	import { s_db_type, s_graphRect, s_db_loadTime, s_id_popupView } from '../../ts/state/State';
	import RadioButtons from '../buttons/RadioButtons.svelte'
	import Label from '../kit/Label.svelte';

	function handle_dbTypeAt(index) { dbDispatch.db_changeTo(menuItems[index].id); }

	const menuItems = [
		{ id: DBType.local,	   label: 'local', action: () => { handle_dbTypeAt(0); } },
		{ id: DBType.firebase, label: 'firebase', action: () => { handle_dbTypeAt(1); } },
		{ id: DBType.airtable, label: 'airtable', action: () => { handle_dbTypeAt(2); } }
	];

</script>

<style>
	.modal-overlay {
		left: 0;
		position: fixed;
		justify-content: center;
	}
	.modal-content {
		padding: 10px;
		font-size: 0.8em;
		position: relative;
		background-color: #fff;
	}
</style>

<div class='modal-overlay'
	style='
		width: {k.width_details}px;
		z-index: {ZIndex.frontmost};
		top: {$s_graphRect.origin.y}px;
		height: {$s_graphRect.size.height}px;'>
	<div class='modal-content' style='z-index: {ZIndex.frontmost};'>
		<RadioButtons menuItems={menuItems} idSelected={$s_db_type}/>
		<br>
		{#if $s_db_loadTime}
			<Label>fetch {$s_db_loadTime} s</Label>
		{:else}
			<br>
		{/if}
		<br>
	</div>
</div>
