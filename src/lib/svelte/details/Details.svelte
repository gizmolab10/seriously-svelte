<script lang='ts'>
	import { c, k, u, show, Point, debug, layout, T_Layer, T_Details, T_Info, T_Banner } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_details_ofType, w_device_isMobile, w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { s_details } from '../../ts/state/S_Details';
	import D_Display from '../details/D_Display.svelte';
	import D_Storage from '../details/D_Storage.svelte';
	import D_Header from '../details/D_Header.svelte';
	import D_Traits from '../details/D_Traits.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import D_Tools from '../details/D_Tools.svelte';
	import D_Info from '../details/D_Info.svelte';
	const separator_gap = k.height.separator;
	const titles = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.display], T_Details[T_Details.info], T_Details[T_Details.traits]];
	let ancestry: Ancestry | null = s_details.ancestry;
	let thing: Thing | null = ancestry?.thing ?? null;
	let number_ofDetails = $w_show_details_ofType.length;
	let tops = layout_tops_forDetails();
	let thing_title = thing?.title;

	$: $w_show_details_ofType, $w_device_isMobile, tops = layout_tops_forDetails();
	$: showingDetails_ofType = (t_details: T_Details) => $w_show_details_ofType.includes(T_Details[t_details]);
		
	function layout_tops_forDetails() {
		let top = layout.top_ofBannerAt(T_Banner.crumbs) + k.height.separator - 2;
		const tops_ofDetails: Array<number> = [];
		const visible_indices = $w_show_details_ofType;
		const heights: Array<number> = [];
		let index = 0;
		heights[T_Details.header]  = 40;
		heights[T_Details.storage] = 142;
		heights[T_Details.tools]   = show.tool_boxes ? 229 : 146;
		heights[T_Details.display] = 77;
		heights[T_Details.info]	   = 174;
		heights[T_Details.traits]  = 0;
		while (index <= T_Details.traits) {
			tops_ofDetails[index] = top;
			const t_detail = T_Details[index] as unknown as T_Details;
			if (visible_indices.includes(t_detail) || index == T_Details.header) {
				top += heights[index];
			}
			index += 1;
		}
		return tops_ofDetails;
	}

</script>

<div class='details'
	style='
		left:0px;
		position:absolute;
		z-index:{T_Layer.details};
		width:{k.width_details}px;
		top:{$w_graph_rect.origin.y + 4}px;
		height:{$w_graph_rect.size.height}px;'>
	<D_Header
		style='
			top:0px;
			position:absolute;'/>
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
		<D_Info top={tops[T_Details.info]} number_ofDetails={number_ofDetails}/>
	{/if}
	{#if showingDetails_ofType(T_Details.traits)}
		<Separator
			title='traits'
			add_wings={true}			
			top={tops[T_Details.traits] - separator_gap}/>
		<D_Traits top={tops[T_Details.traits]}/>
	{/if}
</div>
