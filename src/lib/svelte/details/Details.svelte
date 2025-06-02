<script lang='ts'>
	import { k, Point, T_Layer, T_Details, T_Info } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_info_ofType } from '../../ts/common/Stores';
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

	function handle_info_click(button_title: string) {
		console.log('Details handling info click:', button_title);
		if (button_title === 'focus') {
			console.log('Setting info type to focus');
			$w_show_info_ofType = T_Info.focus;
		} else if (button_title === 'selection') {
			console.log('Setting info type to selection');
			$w_show_info_ofType = T_Info.selection;
		}
	}

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
	<Hideable t_details={T_Details.header} has_banner={false} height={26}>
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
	<Hideable t_details={T_Details.info} extra_titles={['focus', 'selection']}>
		<D_Info on_button_click={handle_info_click}/>
	</Hideable>
	<Hideable t_details={T_Details.tags}>
		<D_Tags/>
	</Hideable>
	<Hideable t_details={T_Details.traits}>
		<D_Traits/>
	</Hideable>
</div>
<Separator
	hasBothEnds={false}
	isHorizontal={false}
	margin={k.details_margin}
	zindex={T_Layer.frontmost}
	thickness={k.thickness.separator.thick}
	origin={new Point(2, separator_top)}
	length={$w_graph_rect.size.height + 83}
	corner_radius={k.radius.gull_wings.thick}/>
<Separator
	hasBothEnds={false}
	isHorizontal={false}
	margin={k.details_margin}
	thickness={k.thickness.separator.thick}
	length={$w_graph_rect.size.height + 3}
	corner_radius={k.radius.gull_wings.thick}
	origin={new Point(k.width_details - 2, separator_top)}/>

<style>

	.details::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

</style>