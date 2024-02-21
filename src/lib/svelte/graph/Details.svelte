<script>
	import { k, u, TypeDB, ZIndex, IDPersistant, IDButton, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports';
	import { s_db_type, s_graphRect, s_db_loadTime, s_id_popupView } from '../../ts/managers/State';
	import RadioButtons from '../kit/RadioButtons.svelte'
	import LabelButton from '../kit/LabelButton.svelte';
	import Label from '../kit/Label.svelte';

	function handleDBTypeAt(index) { dbDispatch.changeDBTo(menuItems[index].id); }

	const menuItems = [
		{ id: TypeDB.local,	   label: 'local', action: () => { handleDBTypeAt(0); } },
		{ id: TypeDB.firebase, label: 'firebase', action: () => { handleDBTypeAt(1); } },
		{ id: TypeDB.airtable, label: 'airtable', action: () => { handleDBTypeAt(2); } }
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
		width: {k.detailsWidth}px;
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
