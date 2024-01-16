<script lang='ts'>
	import { k, Size, Point, Thing, ZIndex, signals, svgPath, onDestroy, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_paths_grabbed, s_crumbs_width, s_path_toolsGrab } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grabbedPath: Path;
	let extra = null;
	let size = 10;

	function path_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.path_lastGrabbed; }
	const rebuild_signalHandler = signals.handle_rebuild(() => { toggleDraw = !toggleDraw; });
	onDestroy(() => { rebuild_signalHandler.disconnect() })

	$: {
		const _ = $s_path_toolsGrab;
		updateAncestors($s_crumbs_width);
	}

	$: {
		if ($s_paths_grabbed || grabbedPath == null || ancestors.length == 0) {
			const path = path_lastGrabbed()	// start over with new grab
			if (path) {
				grabbedPath = path;
			}
		}
		updateAncestors($s_crumbs_width);
	}

	function updateAncestors(width: number) {
		if (grabbedPath) {
			ancestors = grabbedPath.things_ancestry(width - 132);
			toggleDraw = !toggleDraw;
		}
	}

</script>

{#key toggleDraw}
	{#if ancestors.length > 0}
		{#each ancestors.map(a => a.parents.length > 1) as multiple, index}
			{#if index > 0}
				<span style='
					color: transparent;
					position: relative;
					top:{size / (multiple ? 4 : 2)}px;
					left: {size / (multiple ? 3 : 3.3)}px;'>
					<FatTriangle
						extra={!multiple ? null : svgPath.circle(size, size / 2, new Point(size / -7, size / 4))}
						strokeColor={grabbedPath.thing(ancestors.length - index)?.color}
						fillColor={grabbedPath.thing(ancestors.length - index)?.color}
						size={size * (!multiple ? 1 : 1.5)}
						position='absolute'
					/>
					&nbsp;{#if multiple}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb thing={ancestors[index]} path={grabbedPath.stripBack(index)}/>
		{/each}
	{/if}
{/key}
