<script lang='ts'>
	import { k, Point, layout, T_Layer, T_Details, T_Direction } from '../../ts/common/Global_Imports';
	import { w_show_graph_ofType, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_graph_rect, w_count_details } from '../../ts/common/Stores';
	import Banner_Hideable from '../mouse/Banner_Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../mouse/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Data from './D_Data.svelte';
	import D_Tags from './D_Tags.svelte';
	const next_previous_titles = [T_Direction.previous, T_Direction.next];
	const width = k.width.details;
	let prior_graph_type = $w_show_graph_ofType;
	let extra_selection_titles = [];

	$: {
		const length = $w_ancestries_grabbed?.length ?? 0;
		extra_selection_titles = length < 2 ? [] : next_previous_titles;
		$w_count_details++;
	}

	$: if (prior_graph_type != $w_show_graph_ofType) {
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
			top:{layout.controls_boxHeight + 2}px;
			width:{k.width.details - 6}px;
			height:{$w_graph_rect.size.height}px;'>
		<Banner_Hideable t_detail={T_Details.header}>
			<D_Header/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.preferences}>
			<D_Preferences/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.actions}>
			<D_Actions/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.selection} extra_titles={extra_selection_titles}>
			<D_Selection/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.tags} extra_titles={next_previous_titles}>
			<D_Tags/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.traits} extra_titles={next_previous_titles}>
			<D_Traits/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.data}>
			<D_Data/>
		</Banner_Hideable>
	</div>
{/key}
<Separator
	isHorizontal={false}
	has_both_wings={true}
	margin={k.details_margin}
	thickness={k.thickness.separator.main}
	corner_radius={k.radius.gull_wings.thick}
	length={$w_graph_rect.size.height + k.thickness.extra}
	origin={new Point(k.width.details - 2, layout.controls_boxHeight)}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}

</style>