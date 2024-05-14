<script lang='ts'>
	import { k, u, Size, Point, Thing, ZIndex, signals, svgPaths, onMount, Ancestry, dbDispatch, Direction } from '../../ts/common/GlobalImports';
	import { s_ancestry_focus, s_graphRect, s_show_details, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/State';
	import CrumbButton from '../buttons/CrumbButton.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	let ancestors: Array<Thing> = [];
	let ancestry: Ancestry;
	let rebuilds = 0;
	let trigger = 0;
	let width = 0;
	let size = 16;
	let left = 0;

	onMount( () => {
		const handleRebuild = signals.handle_rebuildGraph(2, (ancestry) => {
			rebuilds += 1;
		});
		const handleChanges = signals.hangle_thingChanged(0, -1, (value: any) => {
			rebuilds += 1;
		});
		return () => {
			handleChanges.disconnect();
			handleRebuild.disconnect();
		};
	});

	$: {
		const needsUpdate = ($s_ancestry_focus?.title ?? k.empty) + $s_graphRect + ($s_ancestries_grabbed?.length ?? 0);
		if (!ancestry || needsUpdate || ancestors.length == 0) {
			ancestry = h.grabs.ancestry_lastGrabbed ?? h.rootAncestry;	// assure we have a ancestry
			if (!!ancestry) {				
				const windowWidth = u.windowSize.width;
				let encodedCount = 0;
				[encodedCount, width, ancestors] = ancestry.ancestorsWithin(windowWidth - 10);
				left = (windowWidth - width - 20) / 2;
				trigger = encodedCount * 10000 + rebuilds * 100 + left;
			}
		}
	}

</script>

{#key trigger}
	{#if left > 0}
		<span class='left-spacer' style='display: inline-block; width: {left}px;'/>
	{/if}
	{#each ancestors.map(thing => thing.parents.length) as count, index}
		{#if index > 0}
			<span class='crumb-separator' style='
				top:{size / 5}px;
				position: relative;
				color: transparent;
				left: 0px;'>
				<SVGD3 name='dash'
					width={size}
					height={size}
					position='absolute'
					stroke={ancestors[index].color}
					svgPath={svgPaths.dash(size, 0)}
				/>
			</span>
			&nbsp;&nbsp;
		{/if}
		<CrumbButton ancestry={ancestry.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
