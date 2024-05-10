<script>
	import { k, u, ZIndex } from '../../ts/common/GlobalImports';
	import DataSource from './DataSource.svelte';
</script>

<DataSource/>
<div class='horizontal-line'
	style='
		background-color: lightgray;
		z-index: {ZIndex.frontmost};
		width: {k.width_details}px;
		position: absolute;
		height: 1px;
		top: 108px;
		left: 0px;'>
</div>
