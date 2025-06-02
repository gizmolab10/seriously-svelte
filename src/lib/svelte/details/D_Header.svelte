<script lang='ts'>
	import { c, k, u, ux, Point, debug, layout, grabs } from '../../ts/common/Global_Imports';
	import { w_show_info_ofType, w_show_details_ofType } from '../../ts/common/Stores';
	import { w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_graph_rect, w_device_isMobile } from '../../ts/common/Stores';
	import { T_Details, T_Info } from '../../ts/common/Global_Imports';
	const segmented_top = 20;
    let reattachments = 0;

	$: $w_ancestry_focus, $w_ancestries_grabbed, $w_show_info_ofType, update_forKind_ofInfo();

	function update_forKind_ofInfo() {
		console.log('update_forKind_ofInfo');
		grabs.update_forKind_ofInfo();
		reattachments += 1;
	}

</script>

{#key reattachments}
	<div style='
		top:0px;
		white-space:pre;
		position:absolute;
		text-align:center;
		width:{k.width_details}px;
		font-size:{k.font_size.common}px;'>
		{grabs.ancestry_forInfo?.thing?.title.clipWithEllipsisAt(30)}
	</div>
{/key}
