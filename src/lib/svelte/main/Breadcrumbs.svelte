<script lang='ts'>
	import { c, h, k, u, ux, Size, Point, Thing, T_Layer, T_Element, T_Startup } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_graph_rect, w_thing_color, w_background_color } from '../../ts/common/Stores';
	import { debug, colors, signals, svgPaths, Ancestry, layout } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import Breadcrumb_Button from '../buttons/Breadcrumb_Button.svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let left: number = 8;
	export let centered: boolean = false;
	export let width = layout.windowSize.width;
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
		if ($w_t_startup == T_Startup.ready) {
			const needsUpdate = ($w_ancestry_focus?.title ?? k.empty) + $w_graph_rect + ($w_ancestries_grabbed?.length ?? 0);
			if (!ancestry || needsUpdate || things.length == 0) {
				ancestry = h?.ancestry_forBreadcrumbs;		// assure we have an ancestry
				if (!!ancestry) {				
					let parent_widths = 0;					// encoded as one parent count per 2 digits (base 10)
					let widths: number[] = [];
					[things, widths, lefts, parent_widths] = layout.layout_breadcrumbs_forAncestry_centered_starting_within(ancestry, centered, left, width);
					trigger = parent_widths * 10000 + breadcrumb_reattachments * 100 + lefts[0];		// re-render HTML when this value changes
					for (let i = 0; i < things.length; i++) {
						const state = es_breadcrumb(i);
						debug.log_crumbs(`thing ${things[i].title} ancestry ${state.ancestry.title} color ${state.background_color}`);
					}
					debug.log_crumbs(`ALL ${widths} ${things.map(t => t.title)}`);
					breadcrumb_reattachments += 1;
				}
			}
		}
	}

	function es_breadcrumb(index: number): S_Widget {
		const crumb_ancestry = ancestry?.ancestry_createUnique_byStrippingBack(things.length - index - 1);
		return crumb_ancestry.g_widget.s_widget;
	}

</script>

{#key trigger}
	<div
		class='breadcrumbs'
		style='
			top:5px;
			left:7px;
			position:absolute;'>
		{#each things as thing, index}
			{#if index > 0}
				<div
					class='between-breadcrumbs'
					style='
						top:5px;
						position:absolute;
						color:{thing.color};
						left:{lefts[index] - size + 5.5}px;'>
					>
				</div>
			{/if}
			<div
				class='breadcrumb'
				style='
					top:0px;
					position:absolute;'>
				<Breadcrumb_Button
					left={lefts[index]}
					es_breadcrumb={es_breadcrumb(index)}/>
			</div>
		{/each}
	</div>
{/key}
