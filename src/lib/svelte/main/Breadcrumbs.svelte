<script lang='ts'>
	import { g, k, u, w, Size, Point, Thing, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { s_hierarchy, s_ancestry_focus, s_ancestries_grabbed } from '../../ts/state/S_Stores';
	import { signals, svgPaths, Ancestry, databases } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_details_show, s_thing_color } from '../../ts/state/S_Stores';
	import Breadcrumb_Button from '../mouse/Breadcrumb_Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	let size = k.default_buttonSize;
	let lefts: Array<string> = [];
	let things: Array<Thing> = [];
	let ancestry: Ancestry;
	let rebuilds = 0;
	let trigger = 0;

	signals.handle_rebuildGraph(0, (ancestry) => {
		rebuilds += 1;
	});

	$: {
		if (!!$s_thing_color) {
			rebuilds += 1;
		}
	}

	$: {
		const h = $s_hierarchy;
		const needsUpdate = ($s_ancestry_focus?.title ?? k.empty) + $s_graphRect + ($s_ancestries_grabbed?.length ?? 0);
		if (!ancestry || needsUpdate || things.length == 0) {
			ancestry = h.ancestry_forBreadcrumbs;		// assure we have a ancestry
			if (!!ancestry) {				
				let widths: Array<number> = [];
				const windowWidth = w.windowSize.width;
				let parent_widths = 0;	// encoded as one parent count per 2 digits (base 10)
				[things, widths, lefts, parent_widths] = ancestry.layout_breadcrumbs_within(windowWidth);
				trigger = parent_widths * 10000 + rebuilds * 100 + lefts[0];		// re-render HTML when this value changes
				debug.log_crumbs(`${widths} ${things.map(t => t.title)}`);
			}
		}
	}

</script>

{#key trigger}
	{#each things as thing, index}
		{#if index > 0}
			<div class='crumb-separator'
				style='
					color:transparent;
					position:absolute;
					top:{size / 2 + 1}px;
					left:{lefts[index] - size}px;'
				>
				<SVGD3 name='dash'
					width={size}
					height={size}
					position='absolute'
					stroke={thing.color}
					svgPath={svgPaths.dash(size, 0)}
				/>
			</div>
		{/if}
		<Breadcrumb_Button left={lefts[index]} ancestry={ancestry?.stripBack(things.length - index - 1)}/>
	{/each}
{/key}
