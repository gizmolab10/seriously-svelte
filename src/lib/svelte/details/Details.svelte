<script lang='ts'>
	import { c, k, u, show, Point, debug, layout, E_Layer, E_Details } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_e_details, w_device_isMobile } from '../../ts/common/Stores';
	import D_Display from '../details/D_Display.svelte';
	import D_Storage from '../details/D_Storage.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import D_Tools from '../details/D_Tools.svelte';
	import D_Info from '../details/D_Info.svelte';
	const titles = [E_Details[E_Details.storage], E_Details[E_Details.tools], E_Details[E_Details.display], E_Details[E_Details.info]];
	const separator_gap = k.height.separator;
	let tops = layout.layout_tops_forDetails();

	$: $w_e_details, $w_device_isMobile, tops = layout.layout_tops_forDetails();
	$: showingDetails_ofType = (e_details: E_Details) => $w_e_details.includes(E_Details[e_details]);
	
	function selection_closure(e_details: Array<string>) {
		$w_e_details = e_details as Array<E_Details>;
	}

</script>

<div class='details'
	style='
		left:0px;
		position:absolute;
		z-index:{E_Layer.details};
		width:{k.width_details}px;
		top:{$w_graph_rect.origin.y}px;
		height:{$w_graph_rect.size.height}px;'>
	<Segmented
		titles={titles}
		allow_multiple={true}
		name='details-selector'
		selected={$w_e_details}
		origin={new Point(19, 0.5)}
		selection_closure={selection_closure}/>
	{#if showingDetails_ofType(E_Details.storage)}
		<Separator
			title='storage'
			add_wings={true}
			top={tops[E_Details.storage] - separator_gap}/>
		<D_Storage top={tops[E_Details.storage]}/>
	{/if}
	{#if showingDetails_ofType(E_Details.tools)}
		<Separator
			title='tools'
			add_wings={true}
			top={tops[E_Details.tools] - separator_gap}/>
		<D_Tools top={tops[E_Details.tools]}/>
	{/if}
	{#if showingDetails_ofType(E_Details.display)}
		<Separator
			title='display'
			add_wings={true}
			top={tops[E_Details.display] - separator_gap}/>
		<D_Display top={tops[E_Details.display]}/>
	{/if}
	{#if showingDetails_ofType(E_Details.info)}
		<Separator
			title='info'
			add_wings={true}
			top={tops[E_Details.info] - separator_gap}/>
		<D_Info top={tops[E_Details.info]}/>
	{/if}
</div>
