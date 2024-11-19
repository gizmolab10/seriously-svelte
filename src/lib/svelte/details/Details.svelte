<script lang='ts'>
	import { k, u, show, Point, debug, ZIndex, Details_Type } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_db_loadTime, s_details_type } from '../../ts/state/Svelte_Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Storage from './Storage.svelte';
	import Card from './Card.svelte';
	import Info from './Info.svelte';
	const titles = [Details_Type[Details_Type.storage], Details_Type[Details_Type.info], Details_Type[Details_Type.tools], Details_Type[Details_Type.recents]];
	const heights = [20, 100, 0, 0];
	let tops = [0, 0, 0, 0];
	let rebuilds = 0;

	update_tops();

	function selection_closure(types: Array<string>) {
		$s_details_type = types as Array<Details_Type>;
		update_tops();
		rebuilds += 1;
	}

	function update_tops() {
		let top = 42;
		let index = 0;
		let indices = $s_details_type;
		while (index <= Details_Type.recents) {
			tops[index] = top;
			if (indices.includes(Details_Type[index])) {
				top += heights[index];
			}
			index += 1;
		}
	}

</script>

{#key rebuilds}
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
			multiple={true}
			titles={titles}
			origin={new Point(5, 7)}
			selected={$s_details_type}
			selection_closure={selection_closure}/>
		<div class='horizontal-line'
			style='
				top:34px;
				height:1px;
				position:absolute;
				width:{k.width_details}px;
				z-index:{ZIndex.frontmost};
				background-color:lightgray;'>
		</div>
		{#if $s_details_type.includes(Details_Type[Details_Type.storage])}
			<Storage top={tops[Details_Type.storage]}/>
		{/if}
		{#if $s_details_type.includes(Details_Type[Details_Type.info])}
			<Card top={tops[Details_Type.info]}/>
			{#if show.thing_info}
				<Info top={tops[Details_Type.info] + 10}/>
			{/if}
		{/if}
	</div>
{/key}
