<script lang='ts'>
	import { w_show_info_ofType, w_show_details_ofType } from '../../ts/common/Stores';
	import { c, k, u, ux, Point, debug, layout } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { T_Layer, T_Details, T_Info } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_device_isMobile } from '../../ts/common/Stores';
	import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
    let reattachments = 0;

	function info_selection_closure(t_infos: Array<string>) { $w_show_info_ofType = t_infos[0] as T_Info; }
	$: $w_ancestry_focus, $w_show_info_ofType, $w_ancestries_grabbed, update_forKind_ofInfo();
	
	function update_forKind_ofInfo() {
		s_details.update_forKind_ofInfo();
		reattachments += 1;
	}

</script>

{#key reattachments}
	{#if !$w_show_details_ofType || $w_show_details_ofType.length == 0}
		<p style='
			top:-6px;
			position:relative;
			text-align: center;'>
			click on a line below to see its details
		</p>
	{:else}
		<div style='
			top:0px;
			white-space:pre;
			position:absolute;
			text-align:center;
			width:{k.width_details}px;
			font-size:{k.font_size.common}px;'>
			{s_details.ancestry?.thing?.title.clipWithEllipsisAt(30)}
		</div>
		<Segmented
			name='info-type'
			height={k.height.button}
			origin={new Point(79, 20)}
			font_size={k.font_size.smaller}
			selected={[$w_show_info_ofType]}
			titles={[T_Info.focus, T_Info.selection]}
			selection_closure={info_selection_closure}/>
	{/if}
{/key}
