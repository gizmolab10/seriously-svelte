<script lang='ts'>
	import { c, k, u, show, Point, debug, layout, T_Layer, T_Banner, T_Details } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_details } from '../../ts/common/Stores';
	import D_Display from '../details/D_Display.svelte';
	import D_Storage from '../details/D_Storage.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import D_Tools from '../details/D_Tools.svelte';
	import D_Info from '../details/D_Info.svelte';
	const titles = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.display], T_Details[T_Details.info]];
	
	layout.layout_tops_forDetails();
	let tops = layout.tops_ofDetails;

	function selection_closure(t_details: Array<string>) {
		$w_t_details = t_details as Array<T_Details>;
		layout.layout_tops_forDetails();
		tops = layout.tops_ofDetails;
	}

	$: showingDetails_ofType = (t_details: T_Details) => $w_t_details.includes(T_Details[t_details])

</script>

<div class='details'
	style='
		left:0px;
		position:fixed;
		z-index:{T_Layer.details};
		width:{k.width_details}px;
		top:{$w_graph_rect.origin.y}px;
		height:{$w_graph_rect.size.height}px;'>
	<Segmented
		titles={titles}
		allow_multiple={true}
		name='details-selector'
		selected={$w_t_details}
		origin={new Point(6, 6)}
		selection_closure={selection_closure}/>
	{#if showingDetails_ofType(T_Details.storage)}
		<Separator title='storage' top={tops[T_Details.storage] - 8}/>
		<D_Storage top={tops[T_Details.storage]}/>
	{/if}
	<div class='further-details'
		style='width:{k.width_details}px;'>
		{#if showingDetails_ofType(T_Details.tools)}
			<Separator title='tools' top={tops[T_Details.tools] - 8}/>
			<D_Tools top={tops[T_Details.tools]}/>
		{/if}
		{#if showingDetails_ofType(T_Details.display)}
			<Separator title='display' top={tops[T_Details.display] - 8}/>
			<D_Display top={tops[T_Details.display]}/>
		{/if}
		{#if showingDetails_ofType(T_Details.info)}
			<Separator title='info' top={tops[T_Details.info] - 7}/>
			<D_Info top={tops[T_Details.info]}/>
		{/if}
	</div>
</div>
