<script lang='ts'>
	import { k, Size, Point, Thing, ZIndex, svgPath, dbDispatch } from '../../ts/common/GlobalImports';
	import { dot_size, paths_grabbed, crumbsWidth, path_toolsGrab } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grabbedPath: Path;
	let extra = null;
	let size = 10;

	function path_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.path_lastGrabbed; }

	$: {
		const _ = $path_toolsGrab;
		updateAncestors($crumbsWidth);
	}

	$: {
		if ($paths_grabbed || grabbedPath == null || ancestors.length == 0) {
			const path = path_lastGrabbed()	// start over with new grab
			if (path) {
				grabbedPath = path;
			}
		}
		updateAncestors($crumbsWidth);
	}

	function updateAncestors(width: number) {
		if (grabbedPath) {
			ancestors = grabbedPath.ancestralThings(width - 132);
			toggleDraw = !toggleDraw;
		}
	}

</script>

{#key toggleDraw}
	{#if ancestors.length > 0}
		{#each ancestors.map(a => a.parents.length) as count, index}
			{#if index > 0}
				<span style='
					color: transparent;
					position: relative;
					top:{size / ((count > 1) ? 4 : 2)}px;
					left: {size / ((count > 1) ? 3 : 3.3)}px;'>
					<FatTriangle
						extra={(count < 2) ? null : svgPath.circle(size, size / 2, new Point(size / -7, size / 4))}
						strokeColor={grabbedPath.thing(1).color}
						fillColor={grabbedPath.thing(1).color}
						size={size * (count < 2) ? 1 : 1.5}
						position='absolute'
					/>
					&nbsp;{#if count > 1}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb thing={ancestors[index]} path={grabbedPath.stripPath(index)}/>
		{/each}
	{/if}
{/key}
