<script lang='ts'>
	import { g, k, u, show, Point, debug, T_Layer, T_Details } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_details } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Display from './Display.svelte';
	import Storage from './Storage.svelte';
	import Tools from './Tools.svelte';
	import Info from './Info.svelte';
	const titles = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.display], T_Details[T_Details.info]];
	const heights = [116, 40, 42, 0];
	let tops = [0, 0, 0, 0];
	let rebuilds = 0;

	update_tops();

	function selection_closure(t_details: Array<string>) {
		$w_t_details = t_details as Array<T_Details>;
		update_tops();
		rebuilds += 1;
	}

	function update_tops() {
		let top = 42;
		let index = 0;
		let indices = $w_t_details;
		while (index <= T_Details.info) {
			tops[index] = top;
			if (indices.includes(T_Details[index])) {
				top += heights[index];
			}
			index += 1;
		}
	}

	function showingDetails_ofType(t_details: T_Details): boolean {
		return $w_t_details.includes(T_Details[t_details])
	}

</script>

{#key rebuilds}
	<div class='details'
		style='
			left:0px;
			position:fixed;
			background-color:#fff;
			z-index:{T_Layer.details};
			width:{k.width_details}px;
			top:{$w_graph_rect.origin.y}px;
			height:{$w_graph_rect.size.height}px;'>
		<Segmented
			titles={titles}
			allow_multiple={true}
			name='details-selector'
			origin={new Point(6, 7)}
			selected={$w_t_details}
			selection_closure={selection_closure}/>
		{#if showingDetails_ofType(T_Details.storage)}
			<Separator title='storage' top={tops[T_Details.storage] - 8}/>
			<Storage top={tops[T_Details.storage]}/>
		{/if}
		<div class='further-details'
			style='width:{k.width_details}px;'>
			{#if showingDetails_ofType(T_Details.tools)}
				<Separator title='tools' top={tops[T_Details.tools] - 8}/>
				<Tools top={tops[T_Details.tools]}/>
			{/if}
			{#if showingDetails_ofType(T_Details.display)}
				<Separator title='display' top={tops[T_Details.display] - 8}/>
				<Display top={tops[T_Details.display]}/>
			{/if}
			{#if showingDetails_ofType(T_Details.info)}
				<Separator title='info' top={tops[T_Details.info] - 7}/>
				<Info top={tops[T_Details.info]}/>
			{/if}
		</div>
	</div>
{/key}
