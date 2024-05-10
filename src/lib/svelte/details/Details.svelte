<script>
	import { k, u, ZIndex } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/state/State';
	import ColorPicker from './ColorPicker.svelte';
	import DataSource from './DataSource.svelte';
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
		<DataSource/>
		<div class='horizontal-line'
			style='
				background-color: lightgray;
				z-index: {ZIndex.frontmost};
				width: {k.width_details}px;
				position: absolute;
				height: 1px;
				top: 40px;
				left: 0px;'>
		</div>
		<ColorPicker/>
	</div>
</div>
