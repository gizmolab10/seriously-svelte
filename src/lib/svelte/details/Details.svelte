<script lang='ts'>
	import { k, u, Point, debug, ZIndex, signals, onMount, Details_Type } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_db_loadTime, s_details_type } from '../../ts/state/Svelte_Stores';
	import Segmented from '../mouse/Segmented.svelte';
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

	function selection_closure(types: Array<string>) {
		const type = types[0];	// only ever has one element
		$s_details_type = type as Details_Type;
	}

</script>

<div class='details'
	style='
		left:0px;
		position:fixed;
		font-size:0.95em;
		background-color:#fff;
		z-index:{ZIndex.details};
		width:{k.width_details}px;
		top:{$s_graphRect.origin.y}px;
		height:{$s_graphRect.size.height}px;'>
	<Segmented
		name='details'
		origin={new Point(5, 7)}
		selected={[$s_details_type]}
		selection_closure={selection_closure}
		titles={[Details_Type.storage, Details_Type.info, Details_Type.tools, Details_Type.recents]}/>
	<div class='horizontal-line'
		style='
			top:34px;
			height:1px;
			position:absolute;
			width:{k.width_details}px;
			z-index:{ZIndex.frontmost};
			background-color:lightgray;'>
	</div>
	<Storage top=42/>
	{#key rebuilds}
		<div class='thing-information'
			style ='
				top:71px;
				position:absolute;
				z-index: {ZIndex.details};'>
			<Card/>
			{#if debug.info}
				<Info top={show.traits ? 235 : 25}/>
			{/if}
		</div>
	{/key}
</div>
