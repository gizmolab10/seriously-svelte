<script lang='ts'>
	import { k, Point, T_Layer, T_Details, T_Info, T_Direction } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Separator from '../kit/Separator.svelte';
	import D_Display from './D_Display.svelte';
	import D_Storage from './D_Storage.svelte';
	import Hideable from './Hideable.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Tools from './D_Tools.svelte';
	import D_Info from './D_Info.svelte';
	import D_Tags from './D_Tags.svelte';
	const width = k.width_details;
	const separator_top = $w_graph_rect.origin.y - 2;
	const info_titles = [T_Info.focus, T_Info.selection];
	const next_previous_titles = [T_Direction.previous, T_Direction.next];

</script>

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
		width:{k.width_details - 6}px;
		top:{$w_graph_rect.origin.y}px;
		height:{$w_graph_rect.size.height}px;'>
	<Hideable t_details={T_Details.header} hasBanner={false} height={26}>
		<D_Header/>
	</Hideable>
	<Hideable t_details={T_Details.go} extra_titles={info_titles} isToggle={true}>
		<D_Tools/>
	</Hideable>
	<Hideable t_details={T_Details.thing}>
		<D_Info/>
	</Hideable>
	<Hideable t_details={T_Details.tags} extra_titles={next_previous_titles}>
		<D_Tags/>
	</Hideable>
	<Hideable t_details={T_Details.traits} extra_titles={next_previous_titles}>
		<D_Traits/>
	</Hideable>
	<Hideable t_details={T_Details.storage}>
		<D_Storage/>
	</Hideable>
	<Hideable t_details={T_Details.display} isBottom={true}>
		<D_Display/>
	</Hideable>
</div>
<Separator
	hasBothEnds={false}
	isHorizontal={false}
	has_thin_divider={false}
	margin={k.details_margin}
	zindex={T_Layer.frontmost}
	thickness={k.thickness.separator.thick}
	origin={new Point(2, separator_top)}
	length={$w_graph_rect.size.height + 8}
	corner_radius={k.radius.gull_wings.thick}/>
<Separator
	hasBothEnds={false}
	isHorizontal={false}
	has_thin_divider={false}
	margin={k.details_margin}
	thickness={k.thickness.separator.thick}
	length={$w_graph_rect.size.height + 8}
	corner_radius={k.radius.gull_wings.thick}
	origin={new Point(k.width_details - 2, separator_top)}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

</style>