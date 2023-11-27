<script>
	import { DBType, ZIndex, PersistID, ButtonID, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports';
	import { build, dbType, isBusy, dbLoadTime, popupViewID } from '../../ts/managers/State';
	import Preferences_Display from './Preferences_Display.svelte';
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

<div class='modal-overlay' style='z-index: {ZIndex.frontmost};'>
	<div class='modal-content' style='z-index: {ZIndex.frontmost};'>
		<RadioButtons menuItems={menuItems} idSelected={$dbType}/>
		<br>
		{#if $dbLoadTime}
			<Label title={'fetch in ' + $dbLoadTime + ' s'}/>
		{:else}
			<br>
		{/if}
		<br>
		<Preferences_Display/>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		left: 0;
		top: 31px;
		height: 100%;
		width: 100px;
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
