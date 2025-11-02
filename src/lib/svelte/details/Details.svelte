<script lang='ts'>
	import { T_Layer, T_Graph, T_Detail, T_Direction } from '../../ts/common/Global_Imports';
	import { c, k, u, x, Point, layout, elements } from '../../ts/common/Global_Imports';
	import { w_search_state, w_count_details } from '../../ts/managers/Stores';
	import Banner_Hideable from './Banner_Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Data from './D_Data.svelte';
	import D_Tags from './D_Tags.svelte';
	const width = k.width.details;
	const { w_items: w_tags } = x.si_tags;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_items: w_trait_things } = x.si_trait_things;
	const next_previous_titles = [T_Direction.previous, T_Direction.next];
	let prior_search_state = $w_search_state;
	let extra_selection_titles = [];
	let extra_traits_titles = [];
	let extra_tags_titles = [];

	$: {
		const _ = `${$w_trait_things.descriptionBy_sorted_IDs}
		:::${$w_grabbed.descriptionBy_sorted_IDs}
		:::${$w_tags.descriptionBy_sorted_IDs}
		:::${x.si_found.w_index}
		:::${$w_search_state}`;
		const tr_changed = update_titles($w_trait_things.length, extra_traits_titles);
		const g_changed = update_titles($w_grabbed.length, extra_selection_titles);
		const t_changed = update_titles($w_tags.length, extra_tags_titles);
		const s_changed = $w_search_state != prior_search_state;
		if (t_changed || g_changed || tr_changed || s_changed) {
			$w_count_details++;
		}
	}

	function update_titles(count: number, titles: string[]): boolean {
		const new_titles = (count < 2) ? [] : next_previous_titles;
		if (new_titles.length != titles.length) {
			titles.length = 0;
			titles.push(...new_titles);
			return true;
		}
		return false;
	}

</script>

<style>

	.details-stack::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}

</style>

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
		{#if c.has_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.preferences}>
				<D_Preferences/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.actions}>
			<D_Actions/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Detail.selection} extra_titles={extra_selection_titles}>
			<D_Selection/>
		</Banner_Hideable>
		{#if c.has_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.tags} extra_titles={extra_tags_titles}>
				<D_Tags/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.traits} extra_titles={extra_traits_titles}>
				<D_Traits/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.data}>
			<D_Data/>
		</Banner_Hideable>
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
