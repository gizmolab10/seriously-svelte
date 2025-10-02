<script lang='ts'>
	import { c, k, ux, Point, layout, T_Layer, T_Graph, T_Detail, T_Direction } from '../../ts/common/Global_Imports';
	import { w_search_state, w_search_result_row, w_search_show_controls } from '../../ts/managers/Stores';
	import { w_graph_rect, w_count_details, w_show_graph_ofType } from '../../ts/managers/Stores';
	import Banner_Hideable from './Banner_Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Data from './D_Data.svelte';
	import D_Tags from './D_Tags.svelte';
	const next_previous_titles = [T_Direction.previous, T_Direction.next];
	const { w_items: w_grabbed } = ux.s_grabbed_ancestries;
	const width = k.width.details;
	let extra_selection_titles = [];
	let prior_graph_type = $w_show_graph_ofType;
	let show_secondary_controls = $w_search_show_controls || ($w_show_graph_ofType == T_Graph.tree);

	$: {
		const _ = `${$w_search_state}:::${$w_search_result_row}:::${$w_grabbed?.map(a => a.titles.join(',')).join('-') ?? k.empty}`;
		const length = $w_grabbed?.length ?? 0;
		extra_selection_titles = length < 2 ? [] : next_previous_titles;
		$w_count_details++;
	}

	$: if (prior_graph_type != $w_show_graph_ofType) {
		show_secondary_controls = $w_search_show_controls || ($w_show_graph_ofType == T_Graph.tree);
		prior_graph_type = $w_show_graph_ofType;
		$w_count_details++;
	}

</script>

{#key $w_count_details}
	<div class='details-stack'
		style='
			left:3px;
			display:flex;
			overflow-y: auto;
			position:absolute;
			scrollbar-width: none;          /* Firefox */
			flex-direction:column;
			-ms-overflow-style: none;  
			z-index:{T_Layer.details};
			top:{layout.controls_boxHeight}px;
			width:{k.width.details - 6}px;
			height:{layout.windowSize.height - layout.controls_boxHeight}px;'>
		<Banner_Hideable t_detail={T_Detail.header}>
			<D_Header/>
		</Banner_Hideable>
		{#if c.show_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.preferences}>
				<D_Preferences/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.actions}>
			<D_Actions/>
		</Banner_Hideable>
		{#if c.show_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.selection} extra_titles={extra_selection_titles}>
				<D_Selection/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.tags} extra_titles={next_previous_titles}>
				<D_Tags/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.traits} extra_titles={next_previous_titles}>
				<D_Traits/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.data}>
				<D_Data/>
			</Banner_Hideable>
		{/if}
	</div>
{/key}
<Separator name='right-of-details'
	isHorizontal={false}
	has_both_wings={true}
	margin={k.details_margin}
	thickness={k.thickness.separator.main}
	corner_radius={k.radius.gull_wings.thick}
	length={layout.windowSize.height - layout.controls_boxHeight + 6.5}
	origin={new Point(k.width.details - 2, layout.controls_boxHeight - 2.5)}/>

<style>

	.details-stack::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}

</style>