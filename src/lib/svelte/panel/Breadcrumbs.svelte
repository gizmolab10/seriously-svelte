<script lang='ts'>
	import { s_graphRect, s_show_details, s_thing_changed, s_ancestry_focus, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { k, u, Size, Point, Thing, ZIndex, signals, svgPaths, onMount, Ancestry, debugReact, dbDispatch, Direction } from '../../ts/common/GlobalImports';
	import CrumbButton from '../mouse buttons/CrumbButton.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	let ancestors: Array<Thing> = [];
	let size = k.default_buttonSize;
	let lefts: Array<string> = [];
	let ancestry: Ancestry;
	let rebuilds = 0;
	let trigger = 0;
	let left = 0;

	$: {
		const _ = $s_thing_changed;
		rebuilds += 1;
	}

	$: {
		const needsUpdate = ($s_ancestry_focus?.title ?? k.empty) + $s_graphRect + ($s_ancestries_grabbed?.length ?? 0);
		if (!ancestry || needsUpdate || ancestors.length == 0) {
			ancestry = h.grabs.ancestry_lastGrabbed ?? h.rootAncestry;	// assure we have a ancestry
			if (!!ancestry) {				
				const windowWidth = u.windowSize.width;
				let encodedCount = 0;	// encoded as one parent count per digit (base 10)
				[ancestors, lefts, encodedCount] = ancestry.ancestorsWithin(windowWidth - 10);
				left = lefts[0];
				trigger = encodedCount * 10000 + rebuilds * 100 + left;		// re-render HTML when this value changes
			}
		}
	}

</script>

{#key trigger}
	{#each ancestors as ancestor, index}
		{#if index > 0}
			<div class='crumb-separator'
				style='
					color:transparent;
					position:absolute;
					top:{size / 2 + 1}px;
					left:{lefts[index] - 15}px;'
				>
				<SVGD3 name='dash'
					width={size}
					height={size}
					position='absolute'
					stroke={ancestor.color}
					svg_path={svgPaths.dash(size, 0)}
				/>
			</div>
		{/if}
		<CrumbButton left={lefts[index]} ancestry={ancestry.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
