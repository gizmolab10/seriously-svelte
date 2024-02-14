<script lang='ts'>
	import { s_dot_size, s_path_here, s_paths_grabbed, s_crumbs_width, s_path_toolsCluster } from '../../ts/managers/State';
	import { k, Size, Point, Thing, ZIndex, signals, svgPath, onDestroy, dbDispatch } from '../../ts/common/GlobalImports';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let size = 10;
	let insidePath = svgPath.circle(size, size / 2, new Point(size / -7, size / 4));
	let ancestors: Array<Thing> = [];
	let path: Path;
	let sum = 0;

	function path_lastGrabbed() { return k.hierarchy.grabs.path_lastGrabbed; }
	const rebuild_signalHandler = signals.handle_rebuild(() => { sum += 1; });
	onDestroy(() => { rebuild_signalHandler.disconnect() })

	$: {
		const trigger = $s_paths_grabbed + $s_path_toolsCluster + $s_path_here;
		if (!path || trigger || ancestors.length == 0) {
			path = path_lastGrabbed() ?? k.rootPath;	// assure we have a path
			[sum, ancestors] = path.things_ancestryWithin($s_crumbs_width - 132);
			console.log(`CRUMBS sum ${sum} ${path.thing?.title}`);
		}
	}

</script>

{#key sum}
	{#each ancestors.map(thing => thing.parents.length > 1) as multiple, index}
		{#if index > 0}
			<span style='
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
