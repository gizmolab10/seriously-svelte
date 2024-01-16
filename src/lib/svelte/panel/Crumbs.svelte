<script lang='ts'>
	import { s_dot_size, s_paths_grabbed, s_crumbs_width, s_path_toolsGrab } from '../../ts/managers/State';
	import { k, Size, Point, Thing, ZIndex, svgPath, dbDispatch } from '../../ts/common/GlobalImports';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grabbedPath: Path;
	let extra = null;
	let size = 10;

	function path_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.path_lastGrabbed; }

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
						size={size * ((count < 2) ? 1 : 1.5)}
						position='absolute'
					/>
					&nbsp;{#if count > 1}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb thing={ancestors[index]} path={grabbedPath.stripBack(index)}/>
		{/each}
	{/if}
{/key}
