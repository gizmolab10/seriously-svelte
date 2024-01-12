<script lang='ts'>
	import { k, Size, Point, Thing, ZIndex, svgPath, dbDispatch } from '../../ts/common/GlobalImports';
	import { dot_size, ids_grabbed, crumbsWidth, id_toolsGrab } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
import {index} from 'd3';
	let ancestors: Array<Thing> = [];
	let grabbedThing: Thing;
	let toggleDraw = false;
	let extra = null;
	let size = 10;

	function thing_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.thing_lastGrabbed; }

	$: {
		const _ = $id_toolsGrab;
		updateAncestors($crumbsWidth);
	}

	$: {
		if ($ids_grabbed || grabbedThing == null || ancestors.length == 0) {
			const thing = thing_lastGrabbed()	// start over with new grab
			if (thing) {
				grabbedThing = thing;
			}
		}
		updateAncestors($crumbsWidth);
	}

	function updateAncestors(width: number) {
		if (grabbedThing) {
			ancestors = grabbedThing.ancestors(width - 132);
			toggleDraw = !toggleDraw;
		}
	}

	function pathToIndex(end: number) {
		let index = 0;
		let path = '';
		while (index <= end) {
			const id = ancestors[index].id;
			if (index != 0) {
				path += k.pathSeparator;
			}
			path += id;
			index += 1;
		}
		return path;
	}

</script>

{#key toggleDraw}
	{#if ancestors.length > 0}
		{#each ancestors as ancestor, index}
			{#if index > 0}
				<span style='
					color: transparent;
					position: relative;
					top:{size / ((ancestor.parents.length > 1) ? 4 : 2)}px;
					left: {size / ((ancestor.parents.length > 1) ? 3 : 3.3)}px;'>
					<FatTriangle
						extra={(ancestor.parents.length < 2) ? null : svgPath.circle(size, size / 2, new Point(size / -7, size / 4))}
						size={size * (ancestor.parents.length < 2) ? 1 : 1.5}
						strokeColor={ancestor.firstParent.color}
						fillColor={ancestor.firstParent.color}
						position='absolute'
					/>
					&nbsp;{#if ancestor.parents.length > 1}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb thing={ancestor} path={pathToIndex(index)}/>
		{/each}
	{/if}
{/key}
