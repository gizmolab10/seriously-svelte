<script lang='ts'>
	import { c, k, u, show, Point, debug, layout, T_Layer, T_Details, T_Info, T_Banner } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_device_isMobile, w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_show_details_ofType, w_show_details_asStack } from '../../ts/common/Stores';
	import Vertical_Stack from '../kit/Vertical_Stack.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Hideable from '../kit/Hideable.svelte';
	import D_Display from './D_Display.svelte';
	import D_Storage from './D_Storage.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Tools from './D_Tools.svelte';
	import D_Info from './D_Info.svelte';
	import D_Tags from './D_Tags.svelte';
	const width = k.width_details;
	const separator_gap = k.height.separator;
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
		heights[T_Details.storage] = 156;
		heights[T_Details.tools]   = show.tool_boxes ? 229 : 146;
		heights[T_Details.display] = 77;
		heights[T_Details.info]	   = 174;
		heights[T_Details.tags]    = 100;
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
		width:{width}px;
		position:absolute;
		z-index:{T_Layer.details};
		top:{$w_graph_rect.origin.y + 4}px;
		height:{$w_graph_rect.size.height}px;'>
	{#if $w_show_details_asStack}
		<Vertical_Stack width={width}>
			<Hideable title='header' width={width} isHidden={true}>
				<D_Header/>
			</Hideable>
			<Hideable title='storage' width={width} isHidden={true}>
				<D_Storage/>
			</Hideable>
			<Hideable title='tools' width={width} isHidden={true}>
				<D_Tools/>
			</Hideable>
		</Vertical_Stack>
	{:else}
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
		{#if showingDetails_ofType(T_Details.tags)}
			<Separator
				title='tags'
				add_wings={true}			
				top={tops[T_Details.tags] - separator_gap}/>
			<D_Tags top={tops[T_Details.tags]}/>
		{/if}
		{#if showingDetails_ofType(T_Details.traits)}
			<Separator
				title='traits'
				add_wings={true}			
				top={tops[T_Details.traits] - separator_gap}/>
			<D_Traits top={tops[T_Details.traits]}/>
		{/if}
	{/if}
</div>
