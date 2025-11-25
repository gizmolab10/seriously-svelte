<script lang='ts'>
	import { c, h, k, s, u, x, debug, hover, search, colors, signals, elements } from '../../ts/common/Global_Imports';
	import { Size, Point, Thing, T_Signal, T_Startup, T_Hoverable } from '../../ts/common/Global_Imports';
	import { svgPaths, Ancestry, layout, S_Component} from '../../ts/common/Global_Imports';
	import Breadcrumb_Button from '../mouse/Breadcrumb_Button.svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let width = layout.windowSize.width;
	export let centered: boolean = false;
	export let left: number = 28;
	const { w_thing_color } = colors;
	const { w_search_state } = search;
	const { w_rect_ofGraphView } = layout;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_s_title_edit, w_ancestry_forDetails, w_t_startup } = s;
	let s_component: S_Component | null = null;
	let things: Array<Thing> = [];
	let size = k.height.button;
	let lefts: string[] = [];
	let ancestry: Ancestry;
	let reattachments = 0;
	let trigger = 0;
	
	s_component = signals.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], 1, null, T_Hoverable.breadcrumbs, (t_signal, value): S_Component | null => {
		update();
	});

	onMount(() => { return () => s_component.disconnect(); });
	
	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
		:::${$w_rect_ofGraphView.description}
		:::${$w_s_title_edit?.description}
		:::${$w_ancestry_forDetails?.id}
		:::${x.si_found.w_index}
		:::${$w_search_state}
		:::${$w_thing_color}
		:::${$w_t_startup}`;
		update();
	}

	function update() {
		ancestry = $w_ancestry_forDetails;		// assure we have an ancestry
		if (!!ancestry && $w_t_startup == T_Startup.ready) {				
			let parent_widths = 0;					// encoded as one parent count per 2 digits (base 10)
			let widths: Array<number> = [];
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

	function s_breadcrumbAt(index: number): S_Widget | null {
		const crumb_ancestry = ancestry?.ancestry_createUnique_byStrippingBack(things.length - index - 1);
		return crumb_ancestry?.g_widget.s_widget ?? null;
	}

</script>

{#key trigger}
	<div class='breadcrumbs'
		id = {s_component.id}
		style='
			left:7px;
			top:-5.5px;
			position:absolute;'>
		{#each things as thing, index}
			{#if index > 0}
				<div class='between-breadcrumbs'
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
					left={lefts[index]}
					s_breadcrumb={s_breadcrumbAt(index)}/>
			</div>
		{/each}
	</div>
{/key}
