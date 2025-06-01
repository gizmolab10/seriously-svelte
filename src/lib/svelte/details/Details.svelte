<script lang='ts'>
	import { k, T_Layer, T_Details } from '../../ts/common/Global_Imports';
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

</script>

<div class='details-stack'
	style='
		left:4px;
		display:flex;
		overflow-y: auto;
		position:absolute;
		scrollbar-width: none;          /* Firefox */
		flex-direction:column;
		-ms-overflow-style: none;  
		z-index:{T_Layer.details};
		width:{k.width_details - 6}px;
		top:{$w_graph_rect.origin.y + 4}px;
		height:{$w_graph_rect.size.height - 4}px;'>
	<Hideable t_details={T_Details.header} has_banner={false} height={48}>
		<D_Header/>
	</Hideable>
	<Hideable t_details={T_Details.storage}>
		<D_Storage/>
	</Hideable>
	<Hideable t_details={T_Details.tools}>
		<D_Tools/>
	</Hideable>
	<Hideable t_details={T_Details.display}>
		<D_Display/>
	</Hideable>
	<Hideable t_details={T_Details.info}>
		<D_Info/>
	</Hideable>
	<Hideable t_details={T_Details.tags}>
		<D_Tags/>
	</Hideable>
	<Hideable t_details={T_Details.traits}>
		<D_Traits/>
	</Hideable>
</div>
<Separator
	left={2}
	add_wings={true}
	isHorizontal={false}
	margin={k.details_margin}
	zindex={T_Layer.frontmost}
	thickness={k.thickness.normal}
	top={$w_graph_rect.origin.y - 3}
	height={$w_graph_rect.size.height + 83}
	corner_radius={k.radius.gull_wings.common}/>
<Separator
	add_wings={true}
	isHorizontal={false}
	left={k.width_details}
	margin={k.details_margin}
	thickness={k.thickness.normal}
	top={$w_graph_rect.origin.y - 3}
	height={$w_graph_rect.size.height + 3}
	corner_radius={k.radius.gull_wings.common}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

</style>