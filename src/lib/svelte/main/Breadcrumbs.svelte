<script lang='ts'>
	import { c, k, u, ux, w, Size, Point, Thing, debug, T_Tool, T_Layer, T_Element } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { signals, svgPaths, Ancestry, databases } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_graph_rect, w_color_trigger } from '../../ts/common/Stores';
	import Breadcrumb_Button from '../mouse/Breadcrumb_Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	const separator = '>';
	let size = k.default_buttonSize;
	let lefts: Array<string> = [];
	let things: Array<Thing> = [];
	let breadcrumbs_rebuilds = 0;
	let ancestry: Ancestry;
	let trigger = 0;

	signals.handle_rebuild_andRecreate(1, (ancestry) => {
		breadcrumbs_rebuilds += 1;
	});

	$: {
		const _ = $w_s_title_edit + $w_color_trigger + $w_ancestries_grabbed;
		breadcrumbs_rebuilds += 1;
	}

	$: {
		const h = $w_hierarchy;
		const needsUpdate = ($w_ancestry_focus?.title ?? k.empty) + $w_graph_rect + ($w_ancestries_grabbed?.length ?? 0);
		if (!ancestry || needsUpdate || things.length == 0) {
			ancestry = h.ancestry_forBreadcrumbs;		// assure we have an ancestry
			if (!!ancestry) {				
				let widths: Array<number> = [];
				const windowWidth = w.windowSize.width;
				let parent_widths = 0;	// encoded as one parent count per 2 digits (base 10)
				[things, widths, lefts, parent_widths] = ancestry.layout_breadcrumbs_within(windowWidth);
				trigger = parent_widths * 10000 + breadcrumbs_rebuilds * 100 + lefts[0];		// re-render HTML when this value changes
				debug.log_crumbs(`ALL ${widths} ${things.map(t => t.title)}`);
			}
		}
	}

	function es_breadcrumb(index: number, thing: Thing): S_Element {
		return ux.s_element_for(ancestry?.stripBack(things.length - index - 1), T_Element.breadcrumb, T_Tool.none);
	}

</script>

{#key trigger}
	{#each things as thing, index}
		{#if index > 0}
			<div class='crumb-separator'
				style='
					position:absolute;
					color:{thing.color};
					top:{size / 2 - 2}px;
					left:{lefts[index] - size + 4}px;'>
				{separator}
			</div>
		{/if}
		<Breadcrumb_Button
			thing={thing}
			left={lefts[index]}
			es_breadcrumb={es_breadcrumb(index, thing)}/>
	{/each}
{/key}
