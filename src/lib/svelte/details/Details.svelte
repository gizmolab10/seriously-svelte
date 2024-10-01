<script lang='ts'>
	import { k, u, show, debug, ZIndex, signals, onMount } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_db_loadTime } from '../../ts/state/Reactive_State';
	import Storage from './Storage.svelte';
	import Card from './Card.svelte';
	import Info from './Info.svelte';
	let rebuilds = 0;
	
	onMount(() => {
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {

			// react to remote Thing changes

			debug.log_mount(` DETAILS`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});
	
	// import Segmented_Control from '../mouse buttons/Segmented_Control.svelte';
	// 	<Segmented_Control
	// 		name='db-choices'
	// 		rect={control_rect}
	// 		items={['local ', ' firebase ', ' airtable']}/>

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
			height:100%;
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
	{#key rebuilds}
		<div class='information'
			style ='
				top:41px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<Card/>
			{#if show.info}
				<Info top={show.quests ? 235 : 53}/>
			{/if}
		</div>
	{/key}
</div>
