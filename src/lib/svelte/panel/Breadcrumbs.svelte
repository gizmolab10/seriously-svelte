<script lang='ts'>
	import { k, u, Size, Point, Thing, ZIndex, signals, svgPaths, onMount, Ancestry, debugReact, dbDispatch, Direction } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_show_details, s_thing_changed, s_ancestry_focus, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/Stores';
	import CrumbButton from '../buttons/CrumbButton.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	let ancestors: Array<Thing> = [];
	let lefts: Array<string> = [];
	let ancestry: Ancestry;
	let rebuilds = 0;
	let trigger = 0;
	let width = 0;
	let size = k.default_buttonSize;
	let left = 0;

	onMount(() => {
		debugReact.log_mount(`BREADCRUMBS`);
		const handleRebuild = signals.handle_rebuildGraph(2, (ancestry) => {
			rebuilds += 1;
		});
		return () => {
			handleRebuild.disconnect();
		};
	});

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
				let encodedCount = 0;
				[encodedCount, width, ancestors] = ancestry.ancestorsWithin(windowWidth - 10);
				left = (windowWidth - width - 20) / 2;
				trigger = encodedCount * 10000 + rebuilds * 100 + left;
				setupStyles();
			}
		}
	}

	function setupStyles() {
		let sum = left;
		lefts = [];
		// const complete = [h.rootAncestry, ...ancestors];
		for (const ancestor of ancestors) {
			const title = ancestor.title;
			const width = u.getWidthOf(title);
			sum += width + size * 2;
			console.log(`${width} ${sum} ${title}`);
			lefts.push(sum);
		}
	}

</script>

{#key trigger}
	{#if left > 0}
		<div class='left-spacer' style='display: inline-block; width: {left}px;'/>
	{/if}
	{#each ancestors as ancestor, index}
		{#if index > 0}
			<div class='crumb-separator' style='
				color:transparent;
				position:absolute;
				top:{size / 2 + 1}px;
				left:{lefts[index] - 40}px;'>
				<SVGD3 name='dash'
					width={size}
					height={size}
					position='absolute'
					stroke={ancestor.color}
					svg_path={svgPaths.dash(size, 0)}
				/>
			</div>
			&nbsp;&nbsp;
		{/if}
		<CrumbButton left={lefts[index]} ancestry={ancestry.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
