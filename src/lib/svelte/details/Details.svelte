<script lang='ts'>
	import { s_graphRect, s_db_loadTime } from '../../ts/state/Reactive_State';
	import { k, u, ZIndex } from '../../ts/common/Global_Imports';
	import Storage from './Storage.svelte';
	import Info from './Info.svelte';
</script>

<div class='details-modal-overlay'
	style='
		left:0px;
		position:fixed;
		font-size:0.8em;
		background-color:#fff;
		z-index:{ZIndex.details};
		width:{k.width_details}px;
		top:{$s_graphRect.origin.y}px;
		height:{$s_graphRect.size.height}px;'>
	<div class='details-modal-content'
		style='
			height:40px;
			padding:5px;
			justify-content:center;'>
		<Storage/>
	</div>
	<div class='horizontal-line'
		style='
			top:40px;
			height:1px;
			position:absolute;
			width:{k.width_details}px;
			z-index:{ZIndex.frontmost};
			background-color:lightgray;'>
	</div>
	<div class='information'
		style ='
			top:45px;
			position:absolute;
			z-index: {ZIndex.details};'>
		<Info/>
	</div>
</div>
