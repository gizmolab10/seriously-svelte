<script lang='ts'>
	import { s_dot_size, s_path_here, s_graphRect, s_show_details, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import { g, k, u, Size, Point, Thing, ZIndex, signals, svgPath, onDestroy, dbDispatch } from '../../ts/common/GlobalImports';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let size = 10;
	let insidePath = svgPath.circle(size, size / 2, new Point(-1, size / 4));
	let ancestors: Array<Thing> = [];
	let path: Path;
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

</script>

{#key `${sum} ${left}`}
	{#if left > 0}
		<span class='left-spacer' style='display: inline-block; width: {left}px;'/>
	{/if}
	{#each ancestors.map(thing => thing.parents.length > 1) as multiple, index}
		{#if index > 0}
			<span class='crumb-separator' style='
				position: relative;
				color: transparent;
				top:{size / (multiple ? 4 : 2)}px;
				left: {size / (multiple ? 3 : 3.3)}px;'>
				<FatTriangle
					position='absolute'
					fillColor={ancestors[index].color}
					size={size * (!multiple ? 1 : 1.5)}
					strokeColor={ancestors[index].color}
					extra={!multiple ? null : insidePath}
				/>
				&nbsp;{#if multiple}-{/if}&nbsp;
			</span>
		{/if}
		<Crumb path={path.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
