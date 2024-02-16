<script>
	import { k, ZIndex, signals, IDButton, PersistID, svgPath, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_showDetails, s_id_popupView } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import SVGD3 from '../svg/SVGD3.svelte';
	const topBandHeight = k.bandHeightAtTop - 2;
	let width = window.innerWidth;
	let size = 16;
	let bigSize = size * 1.5;

	window.addEventListener('resize', (event) => { width = window.innerWidth; });
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	function buttonClickedForID(id) {
		alert(`alter "${id}" is under construction`)
	}

	function details_buttonClicked(event) {
		$s_showDetails = !$s_showDetails;
		signals.signal_relayout_fromHere();
		persistLocal.writeToKey(PersistID.details, $s_showDetails);
	}
</script>

<style>
	.button {
		border-radius: 1em;
		position: absolute;
		border: 1px solid;
		cursor: pointer;
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
		color='transparent'
		borderColor='transparent'
		onClick={details_buttonClicked}>
		<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
	</CircularButton>
	{#if k.showControls}
		<button class='button'
			style='
				left: 30px;
				background-color: {k.backgroundColor};'
			on:click={() => buttonClickedForID(IDButton.relations)}>
			children
		</button>
		<button class='button'
			style='
				left: 97px;
				background-color: {k.backgroundColor};'
			on:click={() => buttonClickedForID(IDButton.layout)}>
			tree
		</button>
		<CircularButton
			size={size}
			left={width - 102}
			color={k.backgroundColor}
			onClick={(event) => buttonClickedForID(IDButton.smaller)}>
			<SVGD3
				size={size}
				scalablePath={svgPath.dash(size, 2)}
			/>
		</CircularButton>
		<CircularButton
			size={size}
			left={width - 76}
			color={k.backgroundColor}
			onClick={(event) => buttonClickedForID(IDButton.bigger)}>
			<SVGD3
				size={size}
				scalablePath={svgPath.tCross(size, 2)}
			/>
		</CircularButton>
	{/if}
	<button class='button'
		style='
			left: {width - 60}px;
			background-color: {k.backgroundColor};'
		on:click={() => togglePopupID(IDButton.buildNotes)}>
		{$s_build}
	</button>
	<CircularButton
		size={size}
		left={width - 15}
		color={k.backgroundColor}
		onClick={(event) => togglePopupID(IDButton.help)}>?
	</CircularButton>
</div>