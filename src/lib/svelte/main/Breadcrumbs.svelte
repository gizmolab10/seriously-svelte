<script lang='ts'>
	import { c, h, k, u, ux, w, Size, Point, Thing, T_Layer, T_Element } from '../../ts/common/Global_Imports';
	import { debug, colors, signals, svgPaths, Ancestry, layout } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_graph_rect, w_thing_color, w_background_color } from '../../ts/common/Stores';
	import Breadcrumb_Button from '../buttons/Breadcrumb_Button.svelte';
	import Separator from '../kit/Separator.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import { onMount } from 'svelte';
	let separator_color = colors.separator;
	let breadcrumb_reattachments = 0;
	let things: Array<Thing> = [];
	let size = k.height.button;
	let lefts: string[] = [];
	let ancestry: Ancestry;
	let trigger = 0;

	signals.handle_rebuild_andReattach(1, (ancestry) => { breadcrumb_reattachments += 1; });
	
	$: $w_s_text_edit, $w_thing_color, $w_ancestries_grabbed, breadcrumb_reattachments += 1;
	$: $w_background_color, separator_color = colors.separator;

	$: {
		const needsUpdate = ($w_ancestry_focus?.title ?? k.empty) + $w_graph_rect + ($w_ancestries_grabbed?.length ?? 0);
		if (!ancestry || needsUpdate || things.length == 0) {
			ancestry = h.ancestry_forBreadcrumbs;		// assure we have an ancestry
			if (!!ancestry) {				
				let widths: number[] = [];
				const windowWidth = w.windowSize.width;
				let parent_widths = 0;	// encoded as one parent count per 2 digits (base 10)
				[things, widths, lefts, parent_widths] = ancestry.layout_breadcrumbs_within(windowWidth);
				trigger = parent_widths * 10000 + breadcrumb_reattachments * 100 + lefts[0];		// re-render HTML when this value changes
				debug.log_crumbs(`ALL ${widths} ${things.map(t => t.title)}`);
				breadcrumb_reattachments += 1;
			}
		}
	}

	function es_breadcrumb(index: number, thing: Thing): S_Element {
		return ux.s_element_for(ancestry?.ancestry_createUnique_byStrippingBack(things.length - index - 1), T_Element.breadcrumb, k.space);
	}

</script>

<div class='breadcrumbs'
	style='left:0px;
		width:100%;
		position: absolute;
		top:{layout.breadcrumbs_top}px;
		z-index: {T_Layer.frontmost};
		height:{k.breadcrumbs_height}px;'>
	{#key trigger}
		{#each things as thing, index}
			{#if index > 0}
				<div class='crumb-tweener'
					style='
						top:5px;
						position:absolute;
						color:{thing.color};
						left:{lefts[index] - size + 3}px;'>
					>
				</div>
			{/if}
			<Breadcrumb_Button
				thing={thing}
				left={lefts[index]}
				es_breadcrumb={es_breadcrumb(index, thing)}/>
		{/each}
	{/key}
	<div class='separator-above-crumbs' style='
		height: {k.thickness.separator.thick}px;
		background-color:{separator_color};
		position: absolute;
		width:100%;
		top: 0px;'>
	</div>
	<Separator
		isHorizontal={false}
		has_thin_divider={false}
		origin={new Point(2, 2)}
		margin={k.details_margin}
		length={k.height.banner.crumbs + 12}
		thickness={k.thickness.separator.thick}
		corner_radius={k.radius.gull_wings.thick}/>
	<Separator
		isHorizontal={false}
		has_thin_divider={false}
		margin={k.details_margin}
		length={k.height.banner.crumbs + 12}
		thickness={k.thickness.separator.thick}
		corner_radius={k.radius.gull_wings.thick}
		origin={new Point(w.windowSize.width - 2, 2)}/>
	<div class='separator-below-crumbs' style='
		height: {k.thickness.separator.thick}px;
		top:{layout.breadcrumbs_height - 4}px;
		background-color:{separator_color};
		position: absolute;
		width:100%;'>
	</div>
</div>
