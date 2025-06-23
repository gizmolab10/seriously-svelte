<script lang='ts'>
	import { c, k, u, ux, Point, debug, colors, layout, grabs, Ancestry } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_graph_rect, w_device_isMobile } from '../../ts/common/Stores';
	import { T_Details, S_Widget } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/common/Stores';
	let ancestry: Ancestry | null = null;
	let background_color = 'transparent';
	let s_widget: S_Widget | null = null;
	let color = colors.default;
    let reattachments = 0;

	$: {
		ancestry = grabs.latest;
		s_widget = ux.s_widget_forAncestry(ancestry);
		const _ = `${$w_thing_color}${$w_ancestries_grabbed.join(',')}`;
		background_color = s_widget?.background_color ?? 'transparent';
		color = s_widget?.color ?? colors.default;
		reattachments += 1;
	}

</script>

{#key reattachments}
	<div style='
		top:0px;
		height:20px;
		display:flex;
		color:{color};
		white-space:pre;
		position:relative;
		text-align:center;
		align-items:center;
		justify-content:center;
		width:{k.width_details}px;
		font-size:{k.font_size.common}px;
		background-color:{background_color};'>
		{grabs.latest_thing?.title.clipWithEllipsisAt(30)}
	</div>
{/key}
