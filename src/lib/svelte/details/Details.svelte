<script lang='ts'>
	import { g, k, u, show, Point, debug, ZIndex, Details_Type } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_detail_types } from '../../ts/state/Svelte_Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Recents from './Recents.svelte';
	import Storage from './Storage.svelte';
	import Tools from './Tools.svelte';
	import Info from './Info.svelte';
	const titles = [Details_Type[Details_Type.storage], Details_Type[Details_Type.tools], Details_Type[Details_Type.recents], Details_Type[Details_Type.info]];
	const heights = [116, 40, 100, 0];
	let tops = [0, 0, 0, 0];
	let rebuilds = 0;

	update_tops();

	function selection_closure(types: Array<string>) {
		$s_detail_types = types as Array<Details_Type>;
		update_tops();
		rebuilds += 1;
	}

	function update_tops() {
		let top = 42;
		let index = 0;
		let indices = $s_detail_types;
		while (index <= Details_Type.info) {
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
			titles={titles}
			allow_multiple={true}
			name='details-selector'
			origin={new Point(6, 7)}
			selected={$s_detail_types}
			selection_closure={selection_closure}/>
		{#if shows_type(Details_Type.storage)}
			<Separator title='storage' top={tops[Details_Type.storage] - 8}/>
			<Storage top={tops[Details_Type.storage]}/>
		{/if}
		<div class='further-details'
			style='font-size:0.8em;
				width:{k.width_details}px;'>
			{#if shows_type(Details_Type.tools)}
				<Separator title='tools' top={tops[Details_Type.tools] - 8}/>
				<Tools top={tops[Details_Type.tools]}/>
			{/if}
			{#if shows_type(Details_Type.recents)}
				<Separator title='recents' top={tops[Details_Type.recents] - 8}/>
				<Recents top={tops[Details_Type.recents]}/>
			{/if}
			{#if shows_type(Details_Type.info)}
				<Separator title='info' top={tops[Details_Type.info] - 7}/>
				<Info top={tops[Details_Type.info]}/>
			{/if}
		</div>
	</div>
{/key}
