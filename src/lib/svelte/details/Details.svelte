<script>
	import { s_graphRect, s_db_loadTime } from '../../ts/state/State';
	import { k, u, ZIndex } from '../../ts/common/GlobalImports';
	import Color from './Color.svelte';
	import Data from './Data.svelte';
</script>

<style>
	.details-modal-overlay {
		left: 0px;
		position: fixed;
		justify-content: center;
	}
	.details-modal-content {
		height: 20px;
		padding: 10px;
		font-size: 0.8em;
		position: relative;
		background-color: #fff;
	}
</style>

<div class='details-modal-overlay'
	style='
		width: {k.width_details}px;
		z-index: {ZIndex.frontmost};
		top: {$s_graphRect.origin.y}px;
		height: {$s_graphRect.size.height}px;'>
	<div class='details-modal-content' style='z-index: {ZIndex.frontmost};'>
		<Data/>
		{#if $s_db_loadTime && $s_db_loadTime > 0}
			<div style='
				top: 31px;
				left: 60px;
				color: #333;
				font-size: 11px;
				position: absolute;'>
				fetch took {$s_db_loadTime} s
			</div>
		{/if}
		<div class='horizontal-line'
			style='
				background-color: lightgray;
				z-index: {ZIndex.frontmost};
				width: {k.width_details}px;
				position: absolute;
				height: 1px;
				top: 50px;
				left: 0px;'>
		</div>
		<Color/>
	</div>
</div>
