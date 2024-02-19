<script>
	import { g, k, u, ZIndex, signals, svgPath, IDButton, IDPersistant, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_show_details, s_id_popupView, s_show_child_graph } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import SVGD3 from '../svg/SVGD3.svelte';
	const topBandHeight = k.controlsHeight - 2;
	let width = u.windowSize.width - 20;
	let size = 16;

	window.addEventListener('resize', (event) => { width = u.windowSize.width - 20; });
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	function buttonClickedForID(id) {
		switch (id) {
			case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
			case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
			case IDButton.relations: $s_show_child_graph = !$s_show_child_graph; break;
			default: alert(`alter "${id}" is under construction`); break;
		}
	}

	function details_buttonClicked(event) {
		$s_show_details = !$s_show_details;
		signals.signal_relayout_fromHere();
		persistLocal.writeToKey(IDPersistant.details, $s_show_details);
	}
</script>

<style>
	.button {
		border-radius: 1em;
		position: fixed;
		border: 1px solid;
		cursor: pointer;
		top: 7px;
	}
</style>

<div class='panel-top'
	style='
		top: 9px;
		left: 0px;
		position: fixed;
		z-index: {ZIndex.frontmost};
		height: `${topBandHeight}px`;'>
	{#if !$s_id_popupView}
		<CircularButton left=15
			color='transparent'
			borderColor='transparent'
			onClick={details_buttonClicked}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</CircularButton>
		<CircularButton
			size={size}
			left={40}
			color={k.backgroundColor}
			onClick={(event) => buttonClickedForID(IDButton.smaller)}>
			<SVGD3
				size={size}
				scalablePath={svgPath.dash(size, 2)}
			/>
		</CircularButton>
		<CircularButton
			size={size}
			left={64}
			color={k.backgroundColor}
			onClick={(event) => buttonClickedForID(IDButton.bigger)}>
			<SVGD3
				size={size}
				scalablePath={svgPath.tCross(size, 2)}
			/>
		</CircularButton>
		{#if g.showControls}
			<button class='button'
				style='
					left:80px;
					background-color: {k.backgroundColor};'
				on:click={() => buttonClickedForID(IDButton.relations)}>
				{#if $s_show_child_graph}children{:else}parents{/if}
			</button>
			<button class='button'
				style='
					left: 147px;
					background-color: {k.backgroundColor};'
				on:click={() => buttonClickedForID(IDButton.layout)}>
				tree
			</button>
		{/if}
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