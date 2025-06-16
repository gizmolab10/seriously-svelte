<script lang='ts'>
	import { k, Point, layout, T_Layer, T_Details, T_Direction } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_count_details, w_show_graph_ofType } from '../../ts/common/Stores';
	import Separator from '../kit/Separator.svelte';
	import D_Databases from './D_Databases.svelte';
	import D_Display from './D_Display.svelte';
	import D_Actions from './D_Actions.svelte';
	import Hideable from './Hideable.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
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
			top:{layout.graph_top - 2}px;
			width:{k.width_details - 6}px;
			height:{$w_graph_rect.size.height}px;'>
		<Hideable t_details={T_Details.header} hasBanner={false} height={20}>
			<D_Header/>
		</Hideable>
		<Hideable t_details={T_Details.actions}>
			<D_Actions/>
		</Hideable>
		<Hideable t_details={T_Details.selection}>
			<D_Thing/>
		</Hideable>
		<Hideable t_details={T_Details.tags} extra_titles={next_previous_titles}>
			<D_Tags/>
		</Hideable>
		<Hideable t_details={T_Details.traits} extra_titles={next_previous_titles}>
			<D_Traits/>
		</Hideable>
		<Hideable t_details={T_Details.display} isBottom={true}>
			<D_Display/>
		</Hideable>
		<Hideable t_details={T_Details.database}>
			<D_Databases/>
		</Hideable>
	</div>
{/key}
<Separator
	hasBothEnds={true}
	isHorizontal={false}
	has_thin_divider={false}
	margin={k.details_margin}
	thickness={k.thickness.separator.thick}
	length={$w_graph_rect.size.height + 10}
	corner_radius={k.radius.gull_wings.thick}
	origin={new Point(k.width_details - 2, layout.graph_top - 4)}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

</style>