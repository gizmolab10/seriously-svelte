<script lang='ts'>
	import { c, k, u, ux, Point, debug, search, colors, layout, grabs, Ancestry } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType, w_search_result_row } from '../../ts/managers/Stores';
	import { w_thing_color, w_ancestries_grabbed } from '../../ts/managers/Stores';
	import { w_graph_rect, w_device_isMobile } from '../../ts/managers/Stores';
	import { T_Details, S_Widget } from '../../ts/common/Global_Imports';
	let ancestry: Ancestry | null = null;
	let background_color = 'transparent';
	let color = colors.default;
    let reattachments = 0;

	$: {
		const _ = $w_search_result_row;
		ancestry = grabs.ancestry_forInformation;
		if (!!ancestry) {
			const s_widget = ancestry.g_widget.s_widget;
			const _ = `${$w_thing_color}:::${$w_ancestries_grabbed.map(a => a.titles.join(',')).join('-')}`;
			background_color = s_widget?.background_color ?? 'transparent';
			color = s_widget?.color ?? colors.default;
			reattachments += 1;
		}
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
		width:{k.width.details}px;
		font-size:{k.font_size.common}px;
		background-color:{background_color};'>
		{ancestry?.thing?.title.clipWithEllipsisAt(30) ?? k.empty}
	</div>
{/key}
