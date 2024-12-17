<script lang='ts'>
	import { k, ZIndex } from '../../ts/common/Global_Imports';
	export let width = k.width_details;
	export let top = 71;

</script>

<div class='horizontal-line'
	style='
		height:1px;
		top:{top}px;
		width:{width}px;
		position:absolute;
		z-index:{ZIndex.frontmost};
		background-color:lightgray;'>
</div>