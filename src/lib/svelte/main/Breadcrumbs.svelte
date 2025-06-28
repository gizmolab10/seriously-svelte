<script lang='ts'>
	import { c, h, k, u, ux, Size, Point, Thing, T_Layer, T_Element } from '../../ts/common/Global_Imports';
	import { debug, colors, signals, svgPaths, Ancestry, layout } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_graph_rect, w_thing_color, w_background_color } from '../../ts/common/Stores';
	import Breadcrumb_Button from '../buttons/Breadcrumb_Button.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import Box from '../kit/Box.svelte';
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
			ancestry = h?.ancestry_forBreadcrumbs;		// assure we have an ancestry
			if (!!ancestry) {				
				let widths: number[] = [];
				const windowWidth = layout.windowSize.width;
				let parent_widths = 0;	// encoded as one parent count per 2 digits (base 10)
				[things, widths, lefts, parent_widths] = layout.layout_breadcrumbs_forAncestry_within(ancestry, windowWidth);
				trigger = parent_widths * 10000 + breadcrumb_reattachments * 100 + lefts[0];		// re-render HTML when this value changes
				debug.log_crumbs(`ALL ${widths} ${things.map(t => t.title)}`);
				breadcrumb_reattachments += 1;
			}
		}
	}

	function es_breadcrumb(index: number, thing: Thing): S_Widget {
		const crumb_ancestry = ancestry?.ancestry_createUnique_byStrippingBack(things.length - index - 1);
		return ux.s_widget_forAncestry(crumb_ancestry);
	}

</script>

<div class='breadcrumbs'
	style='left:0px;
		width:100%;
		position: absolute;
		top:{layout.breadcrumbs_top}px;
		height:{layout.panel_boxHeight}px;'>
	{#key trigger}
		<Box
			top={0}
			left={0}
			name='breadcrumbs-box'
			color={separator_color}
			width={layout.windowSize.width}
			height={layout.panel_boxHeight}
			thickness={k.thickness.separator.thick}
			corner_radius={k.radius.gull_wings.thick}>
			<div class='breadcrumbs'
				style='
					top:4px;
					left:7px;
					position:absolute;'>
				{#each things as thing, index}
					{#if index > 0}
						<div class='crumb-tweener'
							style='
								top:5px;
								position:absolute;
								color:{thing.color};
								left:{lefts[index] - size + 5.5}px;'>
							>
						</div>
					{/if}
					<div class='breadcrumb'
						style='
							top:0px;
							position:absolute;'>
						<Breadcrumb_Button
							thing={thing}
							left={lefts[index]}
							es_breadcrumb={es_breadcrumb(index, thing)}/>
					</div>
				{/each}
			</div>
		</Box>
	{/key}
</div>
