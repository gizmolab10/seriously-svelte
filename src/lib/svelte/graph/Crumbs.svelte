<script lang='ts'>
	import { g, k, u, Size, Point, Thing, ZIndex, signals, svgPath, onDestroy, dbDispatch, Direction } from '../../ts/common/GlobalImports';
	import { s_path_here, s_graphRect, s_show_details, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	import SVGD3 from '../svg/SVGD3.svelte';
	let ancestors: Array<Thing> = [];
	let path: Path;
	let size = 14;
	let width = 0;
	let left = 0;
	let sum = 0;

	function path_lastGrabbed() { return g.hierarchy.grabs.path_lastGrabbed; }
	const rebuild_signalHandler = signals.handle_rebuild(() => { sum += 1; });
	onDestroy(() => { rebuild_signalHandler.disconnect() })

	$: {
		const trigger = $s_path_here + $s_graphRect + $s_paths_grabbed;
		if (!path || trigger || ancestors.length == 0) {
			const windowWidth = u.windowSize.width;
			path = path_lastGrabbed() ?? g.rootPath;	// assure we have a path
			[sum, width, ancestors] = path.things_ancestryWithin(windowWidth - 10);
			left = (windowWidth - width - 20) / 2;
		}
	}

					// <SVGD3
					// 	size={size}
					// 	position='absolute'
					// 	stroke={ancestors[index].color}
					// 	scalablePath={svgPath.halfCircle(size, Direction.right)}
					// />

</script>

{#key `${sum} ${left}`}
	{#if left > 0}
		<span class='left-spacer' style='display: inline-block; width: {left}px;'/>
	{/if}
	{#each ancestors.map(thing => thing.parents.length) as count, index}
		{#if index > 0}
			<span class='crumb-separator' style='
				top:{size / 4}px;
				position: relative;
				color: transparent;
				left: {size / 8}px;'>
				<SVGD3
					size={size}
					position='absolute'
					stroke={ancestors[index].color}
					scalablePath={svgPath.dash(size, 0)}
				/>
			</span>
			&nbsp;&nbsp;
		{/if}
		<Crumb path={path.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
