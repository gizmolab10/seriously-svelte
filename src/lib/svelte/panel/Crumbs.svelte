<script lang='ts'>
	import { k, Size, Point, Thing, ZIndex, svgPath, dbDispatch } from '../../ts/common/GlobalImports';
	import { dot_size, ids_grabbed, crumbsWidth } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Spacer from '../kit/Spacer.svelte';
	import Crumb from '../kit/Crumb.svelte';
	import SVGD3 from '../svg/SVGD3.svelte';
import {width} from '../kit/Spacer.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let extra = null;
	let grab: Thing;
	let size = 10;

	function thing_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.thing_lastGrabbed; }

	$: {
		if ($ids_grabbed || grab == null || ancestors.length == 0) {
			const thing = thing_lastGrabbed()	// start over with new grab
			if (thing) {
				grab = thing;
			}
		}
		updateAncestors($crumbsWidth);
	}

	function updateAncestors(width: number) {
		if (grab) {
			ancestors = grab.ancestors(width - 132);
			toggleDraw = !toggleDraw;
		}
	}
</script>

{#key toggleDraw}
	{#if ancestors.length > 0}
		{#each ancestors as thing, index}
			{#if index > 0}
				<span style='
					color: transparent;
					position: relative;
					top:{size / ((thing.parents.length > 1) ? 4 : 2)}px;
					left: {size / ((thing.parents.length > 1) ? 3 : 3.3)}px;'>
					<FatTriangle size={((thing.parents.length < 2) ? size : size * 1.5)}
						strokeColor={thing.firstParent.color}
						fillColor={thing.firstParent.color}
						position='absolute'
					/>
					&nbsp;{#if thing.parents.length > 1}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb thing={thing}/>
		{/each}
	{/if}
{/key}
