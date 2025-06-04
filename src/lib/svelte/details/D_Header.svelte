<script lang='ts'>
	import { c, k, u, ux, Point, debug, layout, grabs } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/common/Stores';
	import { w_ancestries_grabbed, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_graph_rect, w_device_isMobile } from '../../ts/common/Stores';
	import { T_Details } from '../../ts/common/Global_Imports';
	const segmented_top = 20;
    let reattachments = 0;

	$: $w_ancestry_focus, $w_ancestries_grabbed, reattachments += 1;

</script>

{#key reattachments}
	<div style='
		top:0px;
		white-space:pre;
		position:absolute;
		text-align:center;
		width:{k.width_details}px;
		font-size:{k.font_size.common}px;'>
		{grabs.latest_thing?.title.clipWithEllipsisAt(30)}
	</div>
{/key}
