<script lang='ts'>
	import { c, k, u, elements, x, debug, search, colors, layout } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_ancestry_forDetails } from '../../ts/managers/Stores';
	import { Ancestry, T_Detail, S_Widget } from '../../ts/common/Global_Imports';
	import { w_rect_ofGraphView } from '../../ts/managers/Stores';
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_index: w_found } = x.si_found;
	let ancestry: Ancestry | null = null;
	let background_color = 'transparent';
	let color = colors.default;
    let reattachments = 0;

	$: {
	const _ = `${u.descriptionBy_titles($w_grabbed)}
		:::${$w_thing_color}
		:::${$w_found}`;
		ancestry = $w_ancestry_forDetails;
		if (!!ancestry) {
			const s_widget = ancestry.g_widget.s_widget;
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
