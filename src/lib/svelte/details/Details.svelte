<script lang='ts'>
	import { k, Point, layout, T_Layer, T_Details, T_Direction } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_count_details, w_show_graph_ofType } from '../../ts/common/Stores';
	import Separator from '../kit/Separator.svelte';
	import D_Databases from './D_Databases.svelte';
	import D_Display from './D_Display.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import Banner_Hideable from './Banner_Hideable.svelte';
	import D_Thing from './D_Thing.svelte';
	import D_Tags from './D_Tags.svelte';
	const width = k.width_details;
	const next_previous_titles = [T_Direction.previous, T_Direction.next];
	let prior_graph_type = $w_show_graph_ofType;

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
			top:{layout.panel_boxHeight + 2}px;
			width:{k.width_details - 6}px;
			height:{$w_graph_rect.size.height}px;'>
		<Banner_Hideable t_detail={T_Details.header}>
			<D_Header/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.actions}>
			<D_Actions/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.properties}>
			<D_Thing/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.tags} extra_titles={next_previous_titles}>
			<D_Tags/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.traits} extra_titles={next_previous_titles}>
			<D_Traits/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.graph}>
			<D_Display/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Details.database}>
			<D_Databases/>
		</Banner_Hideable>
	</div>
{/key}
<Separator
	has_both_ends={true}
	isHorizontal={false}
	
	margin={k.details_margin}
	thickness={k.thickness.separator.thick}
	length={$w_graph_rect.size.height + 10}
	corner_radius={k.radius.gull_wings.thick}
	origin={new Point(k.width_details - 2, layout.panel_boxHeight)}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}

</style>