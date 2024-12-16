<script lang='ts'>
	import { k, ZIndex } from '../../ts/common/Global_Imports';
	export let top = 71;

</script>

<div class='horizontal-line'
	style='
		height:1px;
		top:{top}px;
		position:absolute;
		width:{k.width_details}px;
		z-index:{ZIndex.frontmost};
		background-color:lightgray;'>
</div>