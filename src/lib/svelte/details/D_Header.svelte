<script lang='ts'>
	import { c, k, u, ux, Point, debug, layout, grabs } from '../../ts/common/Global_Imports';
	import { w_show_info_ofType, w_show_details_ofType } from '../../ts/common/Stores';
	import { w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_graph_rect, w_device_isMobile } from '../../ts/common/Stores';
	import { T_Details, T_Info } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	const separator_top = 12;
    let reattachments = 0;
	const segmented_top = 24;
	function info_selection_closure(t_infos: Array<string>) { $w_show_info_ofType = t_infos[0] as T_Info; }
	$: $w_ancestry_focus, $w_show_info_ofType, $w_ancestries_grabbed, update_forKind_ofInfo();
	
	function update_forKind_ofInfo() {
		grabs.update_forKind_ofInfo();
		reattachments += 1;
	}

</script>

{#key reattachments}
	{#if !$w_show_details_ofType || $w_show_details_ofType.length == 0}
		<p style='
			top:-3px;
			position:relative;
			text-align: center;
			font-size:{k.font_size.smaller}px;'>
			click a line below to view / hide its details
		</p>
	{:else}
		<div style='
			top:-6px;
			white-space:pre;
			position:absolute;
			text-align:center;
			width:{k.width_details}px;
			font-size:{k.font_size.common}px;'>
			{grabs.latest_grab?.thing?.title.clipWithEllipsisAt(30)}
		</div>
		<Separator
			width: 100%;
			top={segmented_top - 9}
			margin={k.details_margin}
			title='show details about'
			thickness={k.thickness.thin}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.smallest}/>
		<Segmented
			name='info-type'
			height={k.height.controls}
			font_size={k.font_size.smaller}
			selected={[$w_show_info_ofType]}
			titles={[T_Info.focus, T_Info.selection]}
			selection_closure={info_selection_closure}
			origin={new Point((k.width_details - 100) / 2, segmented_top)}/>
	{/if}
{/key}
