<script>
	import { DBType, PersistID, onMount, ButtonID, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports';
	import { build, dbType, isBusy, dbLoadTime, popupViewID } from '../../ts/managers/State';
	import RadioButtons from '../kit/RadioButtons.svelte'
	import LabelButton from '../kit/LabelButton.svelte';
	import Label from '../kit/Label.svelte';

	const menuItems = [
		{ id: DBType.local,		 label: 'built in', action: () => { handleDBTypeAt(0); } },
		{ id: DBType.firebase, label: 'firebase', action: () => { handleDBTypeAt(1); } },
		{ id: DBType.airtable, label: 'airtable', action: () => { handleDBTypeAt(2); } }
	];

	function handleBuildsClick(event) {
		$popupViewID = ButtonID.buildNotes;
	}

	function handleDBTypeAt(index) {
		const type = menuItems[index].id;
		const db = dbDispatch.dbForType(type);
		$dbLoadTime = db.loadTime;
		persistLocal.writeToKey(PersistID.db, type);
		if (type != DBType.local && !db.hasData) {
			$isBusy = true;		// set this before changing $dbType so panel will show 'loading ...'
		}
		$dbType = type;			// tell components to render the [possibly previously] fetched data
	}

</script>

<div class="modal-overlay">
	<div class="modal-content">
		<LabelButton
			title='build {$build}'
			onClick={handleBuildsClick}/>
		<br><br>
		<RadioButtons menuItems={menuItems} idSelected={$dbType}/>
		<br>
		{#if $dbLoadTime}
			<Label title={'fetched: ' + $dbLoadTime + ' sec'}/>
		{:else}
			<br>
		{/if}
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		left: 0;
		height: 100%;
		justify-content: center;
	}
	.modal-content {
		background-color: #fff;
		padding: 14px;
		max-width: 500px;
		position: relative;
		font-size: 0.8em;
	}
</style>
