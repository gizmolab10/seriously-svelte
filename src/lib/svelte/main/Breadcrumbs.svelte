<script lang='ts'>
	import { c, k, u, ux, w, Size, Point, Thing, debug, T_Tool, T_Layer, T_Element } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { signals, svgPaths, Ancestry, databases } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_graph_rect, w_thing_color } from '../../ts/common/Stores';
	import Breadcrumb_Button from '../buttons/Breadcrumb_Button.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import { onMount } from 'svelte';
	let breadcrumb_reattachments = 0;
	let size = k.size.button;
	let lefts: Array<string> = [];
	let things: Array<Thing> = [];
	let ancestry: Ancestry;
	let trigger = 0;

	signals.handle_rebuild_andReattach(1, (ancestry) => {
		breadcrumb_reattachments += 1;
	});

	$: {
		const _ = $w_s_title_edit + $w_thing_color + $w_ancestries_grabbed;
		breadcrumb_reattachments += 1;
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
				trigger = parent_widths * 10000 + breadcrumb_reattachments * 100 + lefts[0];		// re-render HTML when this value changes
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
					top:3.5px;
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
