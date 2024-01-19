<script lang='ts'>
	import { k, Size, Point, Thing, ZIndex, signals, svgPath, onDestroy, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_path_here, s_paths_grabbed, s_crumbs_width, s_path_toolsGrab } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let size = 10;
	let path: Path;
	let toggleDraw = false;
	let ancestors: Array<Thing> = [];
	let extra = svgPath.circle(size, size / 2, new Point(size / -7, size / 4));

	function path_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.path_lastGrabbed; }
	const rebuild_signalHandler = signals.handle_rebuild(() => { toggleDraw = !toggleDraw; });
	onDestroy(() => { rebuild_signalHandler.disconnect() })

	$: {
		const _ = $s_path_toolsGrab + $s_path_here;
		updateAncestors();
	}

	$: {
		const trigger = $s_paths_grabbed + $s_path_here;
		if (trigger || ancestors.length == 0) {
			const last = path_lastGrabbed()	// start over with new grab
			if (last) {
				path = last;
			}
		}
		updateAncestors();
	}

	function updateAncestors() {
		if (path) {
			ancestors = path.things_ancestry($s_crumbs_width - 132);
			toggleDraw = !toggleDraw;
		}
	}

</script>

{#key toggleDraw}
	{#each ancestors.map(thing => thing.parents.length > 1) as multiple, index}
		{#if index > 0}
			<span style='
				position: relative;
				color: transparent;
				top:{size / (multiple ? 4 : 2)}px;
				left: {size / (multiple ? 3 : 3.3)}px;'>
				<FatTriangle
					position='absolute'
					extra={!multiple ? null : extra}
					size={size * (!multiple ? 1 : 1.5)}
					fillColor={ancestors[index].color}
					strokeColor={ancestors[index].color}
				/>
				&nbsp;{#if multiple}-{/if}&nbsp;
			</span>
		{/if}
		<Crumb path={path.stripBack(ancestors.length - index - 1)}/>
	{/each}
{/key}
