<script>
	import { k, ZIndex, signals, IDButton, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_showDetails, s_id_popupView } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	const topBandHeight = k.bandHeightAtTop - 2;
	let size = 14;

	function help_buttonClicked() { togglePopupID(IDButton.help); }
	function builds_buttonClicked(event) { togglePopupID(IDButton.buildNotes); }
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	function details_buttonClicked(event) {
		$s_showDetails = !$s_showDetails;
		signals.signal_relayout_fromHere();
		persistLocal.writeToKey(PersistID.details, $s_showDetails);
	}
</script>

<style>
	.build {
		border-radius: 1em;
		position: absolute;
		border: 1px solid;
		cursor: pointer;
		left: 35px;
		top: -2px;
	}
</style>

<div class='panel-top'
	style='
		top: 9px;
		left: 0px;
		position: absolute;
		z-index: {ZIndex.frontmost};
		height: `${topBandHeight}px`;'>
	<CircularButton left=15
		borderColor='white'
		onClick={details_buttonClicked}>
		<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
	</CircularButton>
	<button class='build' on:click={builds_buttonClicked}>{$s_build}</button>
	<CircularButton left=85
		onClick={() => {help_buttonClicked()}}
		size={size}>i
	</CircularButton>
</div>