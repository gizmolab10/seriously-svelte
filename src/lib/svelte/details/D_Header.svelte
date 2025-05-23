<script lang='ts'>
	import { w_show_info_ofType, w_graph_rect, w_show_details_ofType, w_device_isMobile } from '../../ts/common/Stores';
	import { c, k, u, ux, Point, debug, layout } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { T_Layer, T_Details, T_Info } from '../../ts/common/Global_Imports';
	import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
	const titles_ofDetails = [T_Details[T_Details.storage], T_Details[T_Details.tools], T_Details[T_Details.display], T_Details[T_Details.info], T_Details[T_Details.traits]];
    let reattachments = 0;

	$: showingDetails_ofType = (t_details: T_Details) => $w_show_details_ofType.includes(T_Details[t_details]);
	function info_selection_closure(t_infos: Array<string>) { $w_show_info_ofType = t_infos[0] as T_Info; }
	$: $w_show_info_ofType, $w_ancestry_focus, $w_ancestries_grabbed, update_forKind_ofInfo();
	
	function details_selection_closure(t_details: Array<string>) {
		s_details.number_ofDetails = t_details.length;
		$w_show_details_ofType = t_details as Array<T_Details>;
		reattachments += 1;
	}

	function update_forKind_ofInfo() {
		s_details.update_forKind_ofInfo();
		reattachments += 1;
	}

</script>

<div class='details'
	style='
		top:0px;
		left:0px;
		position:absolute;
		width:{k.width_details}px;
		height:{$w_graph_rect.size.height}px;'>
	<Segmented
		allow_none={true}
		allow_multiple={true}
		name='details-selector'
		selected={$w_show_details_ofType}
		titles={titles_ofDetails}
		origin={new Point(4, 0.5)}
		selection_closure={details_selection_closure}/>
	{#key reattachments}
		{#if s_details.number_ofDetails > 0}
			<div style='
				top:24px;
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
				origin={new Point(61, 44)}
				font_size={k.font_size.smaller}
				selected={[$w_show_info_ofType]}
				titles={[T_Info.focus, T_Info.selection]}
				selection_closure={info_selection_closure}/>
		{/if}
	{/key}
</div>
