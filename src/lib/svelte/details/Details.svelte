<script lang='ts'>
	import { c, k, u, show, Point, debug, layout, T_Layer, T_Details } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_details, w_device_isMobile } from '../../ts/common/Stores';
	import D_Display from '../details/D_Display.svelte';
	import D_Storage from '../details/D_Storage.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import D_Tools from '../details/D_Tools.svelte';
	import D_Info from '../details/D_Info.svelte';
	const titles = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.display], T_Details[T_Details.info]];
	const separator_gap = k.height.separator;
	let tops = layout.layout_tops_forDetails();

	$: $w_device_isMobile, tops = layout.layout_tops_forDetails();
	$: showingDetails_ofType = (t_details: T_Details) => $w_t_details.includes(T_Details[t_details]);
	
	function selection_closure(t_details: Array<string>) {
		$w_t_details = t_details as Array<T_Details>;
		tops = layout.layout_tops_forDetails();
	}

</script>

<div class='details'
	style='
		left:0px;
		position:absolute;
		z-index:{T_Layer.details};
		width:{k.width_details}px;
		top:{$w_graph_rect.origin.y}px;
		height:{$w_graph_rect.size.height}px;'>
	<Segmented
		titles={titles}
		allow_multiple={true}
		name='details-selector'
		selected={$w_t_details}
		origin={new Point(14, 0.5)}
		selection_closure={selection_closure}/>
	{#if showingDetails_ofType(T_Details.storage)}
		<Separator
			title='storage'
			add_wings={true}
			top={tops[T_Details.storage] - separator_gap}/>
		<D_Storage top={tops[T_Details.storage]}/>
	{/if}
	{#if showingDetails_ofType(T_Details.tools)}
		<Separator
			title='tools'
			add_wings={true}
			top={tops[T_Details.tools] - separator_gap}/>
		<D_Tools top={tops[T_Details.tools]}/>
	{/if}
	{#if showingDetails_ofType(T_Details.display)}
		<Separator
			title='display'
			add_wings={true}
			top={tops[T_Details.display] - separator_gap}/>
		<D_Display top={tops[T_Details.display]}/>
	{/if}
	{#if showingDetails_ofType(T_Details.info)}
		<Separator
			title='info'
			add_wings={true}
			top={tops[T_Details.info] - separator_gap}/>
		<D_Info top={tops[T_Details.info]}/>
	{/if}
</div>
