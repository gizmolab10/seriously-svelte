<script>
	import { DBType, ZIndex, PersistID, ButtonID, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports';
	import { db_type, db_loadTime, id_popupView } from '../../ts/managers/State';
	import RadioButtons from '../kit/RadioButtons.svelte'
	import LabelButton from '../kit/LabelButton.svelte';
	import Label from '../kit/Label.svelte';

	function handleDBTypeAt(index) { dbDispatch.changeDBTo(menuItems[index].id); }

	const menuItems = [
		{ id: DBType.local,	   label: 'built in', action: () => { handleDBTypeAt(0); } },
		{ id: DBType.firebase, label: 'firebase', action: () => { handleDBTypeAt(1); } },
		{ id: DBType.airtable, label: 'airtable', action: () => { handleDBTypeAt(2); } }
	];

</script>

<style>
	.modal-overlay {
		left: 0;
		top: 31px;
		width: 100px;
		height: 100%;
		position: fixed;
		justify-content: center;
	}
	.modal-content {
		padding: 14px;
		max-width: 500px;
		font-size: 0.8em;
		position: relative;
		background-color: #fff;
	}
</style>

<div class='modal-overlay' style='z-index: {ZIndex.frontmost};'>
	<div class='modal-content' style='z-index: {ZIndex.frontmost};'>
		<RadioButtons menuItems={menuItems} idSelected={$db_type}/>
		<br>
		{#if $db_loadTime}
			<Label>fetch = {$db_loadTime} s</Label>
		{:else}
			<br>
		{/if}
		<br>
	</div>
</div>
