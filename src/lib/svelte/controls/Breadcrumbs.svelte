<script lang='ts'>
	import { c, h, k, u, ux, Size, Point, Thing, debug, colors, signals } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_graph_rect, w_thing_color, w_background_color } from '../../ts/managers/Stores';
	import { T_Layer, T_Signal, T_Element, T_Startup, T_Component } from '../../ts/common/Global_Imports';
	import { svgPaths, Ancestry, layout, components, S_Component} from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/managers/Stores';
	import Breadcrumb_Button from '../buttons/Breadcrumb_Button.svelte';
	import { w_search_result_row } from '../../ts/managers/Stores';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let left: number = 28;
	export let centered: boolean = false;
	export let width = layout.windowSize.width;
	let s_component: S_Component | null = null;
	let separator_color = colors.separator;
	let things: Array<Thing> = [];
	let size = k.height.button;
	let lefts: string[] = [];
	let ancestry: Ancestry;
	let reattachments = 0;
	let trigger = 0;
	
	s_component = signals.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], 1, null, T_Component.breadcrumbs, (t_signal, value): S_Component | null => {
		reattachments += 1;
	});

	onMount(() => { return () => s_component.disconnect(); });
	
	$: $w_s_title_edit, $w_thing_color, $w_ancestries_grabbed, $w_search_result_row, reattachments += 1;
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
					trigger = parent_widths * 10000 + reattachments * 100 + lefts[0];		// re-render HTML when this value changes
					for (let i = 0; i < things.length; i++) {
						const state = s_breadcrumbAt(i);
						if (!!state) {
							debug.log_crumbs(`thing ${things[i].title} ancestry ${state.ancestry.title} color ${state.background_color}`);
						}
					}
					debug.log_crumbs(`ALL ${widths} ${things.map(t => t.title)}`);
					reattachments += 1;
				}
			}
		}
	}

	function s_breadcrumbAt(index: number): S_Widget | null {
		const crumb_ancestry = ancestry?.ancestry_createUnique_byStrippingBack(things.length - index - 1);
		return crumb_ancestry?.g_widget.s_widget ?? null;
	}

</script>

{#key trigger}
	<div
		class='breadcrumbs'
		id = {s_component.id}
		style='
			top:-5px;
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
					s_breadcrumb={s_breadcrumbAt(index)}/>
			</div>
		{/each}
	</div>
{/key}
