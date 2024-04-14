<script lang='ts'>
	import { g, k, u, Path, Size, Point, Thing, ZIndex, signals, svgPaths, onMount, dbDispatch, Direction } from '../../ts/common/GlobalImports';
	import { s_path_focus, s_graphRect, s_show_details, s_paths_grabbed, s_path_graphTools } from '../../ts/common/State';
	import Crumb from '../kit/Crumb.svelte';
	import SVGD3 from '../svg/SVGD3.svelte';
	let ancestors: Array<Thing> = [];
	let rebuilds = 0;
	let trigger = 0;
	let path: Path;
	let width = 0;
	let size = 16;
	let left = 0;

	onMount( () => {
		const handler = signals.handle_rebuildWidgets((path) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});

	$: {
		const needsUpdate = ($s_path_focus?.title ?? k.empty) + $s_graphRect + ($s_paths_grabbed?.length ?? 0);
		if (!path || needsUpdate || ancestors.length == 0) {
			path = g.hierarchy.grabs.path_lastGrabbed ?? g.rootPath;	// assure we have a path
			const windowWidth = u.windowSize.width;
			let encodedCount = 0;
			[encodedCount, width, ancestors] = path.things_ancestryWithin(windowWidth - 10);
			left = (windowWidth - width - 20) / 2;
			trigger = encodedCount * 10000 + rebuilds * 100 + left;
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
		<Crumb path={path.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
