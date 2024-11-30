<script lang='ts'>
	import { g, k, u, show, Point, debug, ZIndex, Details_Type } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_db_loadTime, s_detail_types } from '../../ts/state/Svelte_Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Recents from './Recents.svelte';
	import Storage from './Storage.svelte';
	import Tools from './Tools.svelte';
	import Card from './Card.svelte';
	const titles = [Details_Type[Details_Type.storage], Details_Type[Details_Type.info], Details_Type[Details_Type.tools], Details_Type[Details_Type.recents]];
	const heights = [30, 100, 40, 0];
	let tops = [0, 0, 0, 0];
	let rebuilds = 0;

	update_tops();

	function selection_closure(types: Array<string>) {
		$s_detail_types = types as Array<Details_Type>;
		update_tops();
		rebuilds += 1;
	}

	function update_tops() {
		let top = 68;
		let index = 0;
		let indices = $s_detail_types;
		while (index <= Details_Type.recents) {
			tops[index] = top;
			if (indices.includes(Details_Type[index])) {
				top += heights[index];
			}
			index += 1;
		}
	}

	function shows_type(type: Details_Type): boolean {
		return $s_detail_types.includes(Details_Type[type])
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
			titles={titles}
			allow_multiple={true}
			origin={new Point(7, 7)}
			selected={$s_detail_types}
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
		{#if g.details_type_isVisible(Details_Type.storage)}
			<Storage top={tops[Details_Type.storage]}/>
		{/if}
		{#if g.details_type_isVisible(Details_Type.info)}
			<Card top={tops[Details_Type.info]}/>
		{/if}
		{#if g.details_type_isVisible(Details_Type.tools)}
			<Tools top={tops[Details_Type.tools]}/>
		{/if}
		{#if g.details_type_isVisible(Details_Type.recents)}
			<Recents top={tops[Details_Type.recents]}/>
		{/if}
	</div>
{/key}
