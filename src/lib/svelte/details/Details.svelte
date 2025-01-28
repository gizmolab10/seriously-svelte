<script lang='ts'>
	import { g, k, u, show, Point, debug, T_Layer, T_Details } from '../../ts/common/Global_Imports';
	import { s_graph_rect, s_t_details } from '../../ts/state/S_Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Recents from './Recents.svelte';
	import Storage from './Storage.svelte';
	import Tools from './Tools.svelte';
	import Info from './Info.svelte';
	const titles = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.recents], T_Details[T_Details.info]];
	const heights = [116, 40, 100, 0];
	let tops = [0, 0, 0, 0];
	let rebuilds = 0;

	update_tops();

	function selection_closure(t_details: Array<string>) {
		$s_t_details = t_details as Array<T_Details>;
		update_tops();
		rebuilds += 1;
	}

	function update_tops() {
		let top = 42;
		let index = 0;
		let indices = $s_t_details;
		while (index <= T_Details.info) {
			tops[index] = top;
			if (indices.includes(T_Details[index])) {
				top += heights[index];
			}
			index += 1;
		}
	}

	function showingDetails_ofType(t_details: T_Details): boolean {
		return $s_t_details.includes(T_Details[t_details])
	}

</script>

{#key rebuilds}
	<div class='details'
		style='
			left:0px;
			position:fixed;
			font-size:0.95em;
			background-color:#fff;
			z-index:{T_Layer.details};
			width:{k.width_details}px;
			top:{$s_graph_rect.origin.y}px;
			height:{$s_graph_rect.size.height}px;'>
		<Segmented
			titles={titles}
			allow_multiple={true}
			name='details-selector'
			origin={new Point(6, 7)}
			selected={$s_t_details}
			selection_closure={selection_closure}/>
		{#if showingDetails_ofType(T_Details.storage)}
			<Separator title='storage' top={tops[T_Details.storage] - 8}/>
			<Storage top={tops[T_Details.storage]}/>
		{/if}
		<div class='further-details'
			style='font-size:0.8em;
				width:{k.width_details}px;'>
			{#if showingDetails_ofType(T_Details.tools)}
				<Separator title='tools' top={tops[T_Details.tools] - 8}/>
				<Tools top={tops[T_Details.tools]}/>
			{/if}
			{#if showingDetails_ofType(T_Details.recents)}
				<Separator title='recents' top={tops[T_Details.recents] - 8}/>
				<Recents top={tops[T_Details.recents]}/>
			{/if}
			{#if showingDetails_ofType(T_Details.info)}
				<Separator title='info' top={tops[T_Details.info] - 7}/>
				<Info top={tops[T_Details.info]}/>
			{/if}
		</div>
	</div>
{/key}
