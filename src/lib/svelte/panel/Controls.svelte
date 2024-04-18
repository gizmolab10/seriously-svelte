<script>
	import { g, k, u, ZIndex, signals, svgPaths, IDButton, IDPersistant, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_show_details, s_id_popupView, s_layout_byClusters, s_show_child_graph } from '../../ts/state/State';
	import CircularButton from '../buttons/CircularButton.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	let width = u.windowSize.width - 20;
	let size = 16;

	window.addEventListener('resize', (event) => { width = u.windowSize.width - 20; });
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	function buttclick_closureedForID(id) {
		switch (id) {
			case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
			case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
			case IDButton.details: $s_show_details = !$s_show_details; break;
			case IDButton.layout: $s_layout_byClusters = !$s_layout_byClusters; break;
			case IDButton.relations: $s_show_child_graph = !$s_show_child_graph; break;
		}
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

<div class='controls'
	style='
		top: 9px;
		left: 0px;
		position: fixed;
		z-index: {ZIndex.frontmost};
		height: `${k.height_banner - 2}px`;'>
	{#if !$s_id_popupView}
		<CircularButton left=15
			color='transparent'
			borderColor='transparent'
			click_closure={() => buttclick_closureedForID(IDButton.details)}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</CircularButton>
		{#if k.showControls}
			<button class='button'
				style='
					left:30px;
					background-color: {k.color_background};'
				on:click={() => buttclick_closureedForID(IDButton.relations)}>
				{#if $s_show_child_graph}children{:else}parents{/if}
			</button>
			<button class='button'
				style='
					left: 97px;
					background-color: {k.color_background};'
				on:click={() => buttclick_closureedForID(IDButton.layout)}>
				{#if $s_layout_byClusters}clusters{:else}tree{/if}
			</button>
		{/if}
	{/if}
	{#if u.device_isMobile}
		<CircularButton
			left={width - 130}
			size={size}
			color={k.color_background}
			click_closure={(event) => buttclick_closureedForID(IDButton.smaller)}>
			<SVGD3 name='smaller'
				width={size}
				height={size}
				svgPath={svgPaths.dash(size, 2)}
			/>
		</CircularButton>
		<CircularButton
			size={size}
			left={width - 105}
			color={k.color_background}
			click_closure={(event) => buttclick_closureedForID(IDButton.bigger)}>
			<SVGD3 name='bigger'
				width={size}
				height={size}
				svgPath={svgPaths.t_cross(size, 2)}
			/>
		</CircularButton>
	{/if}
	<button class='button'
		style='
			left: {width - 90}px;
			background-color: {k.color_background};'
		on:click={() => togglePopupID(IDButton.builds)}>
		build {$s_build}
	</button>
	<CircularButton
		size={size}
		left={width - 15}
		color={k.color_background}
		click_closure={(event) => togglePopupID(IDButton.help)}>?
	</CircularButton>
</div>