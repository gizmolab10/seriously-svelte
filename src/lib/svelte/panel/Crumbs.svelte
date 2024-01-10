<script lang='ts'>
	import { k, Size, Point, ZIndex, svgPath, dbDispatch, Relationship, } from '../../ts/common/GlobalImports';
	import { dot_size, ids_grabbed, crumbsWidth, id_showTools } from '../../ts/managers/State';
	import FatTriangle from '../svg/FatTriangle.svelte';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Relationship> = [];
	let grab: Relationship | null;
	let toggleDraw = false;
	let extraPath = null;
	let size = 10;

	function relationship_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.relationship_lastGrabbed; }

	$: {
		const _ = $id_showTools;
		updateAncestors($crumbsWidth);
	}

	$: {
		if ($ids_grabbed || grab == null || ancestors.length == 0) {
			grab = relationship_lastGrabbed()	// start over with new grab
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
		{#each ancestors as ancestor, index}
			{#if index > 0}
				<span style='
					color: transparent;
					position: relative;
					top: {size / ((ancestor.hasMultipleParents) ? 4 : 2)}px;
					left: {size / ((ancestor.hasMultipleParents) ? 3 : 3.3)}px;'>
					<FatTriangle
						extraPath = {!ancestor.hasMultipleParents ? null : svgPath.circle(size, size / 2, new Point(size / -7, size / 4))}
						size = {size * (!ancestor.hasMultipleParents ? 1 : 1.5)}
						strokeColor = {ancestor.fromThing.color}
						fillColor = {ancestor.fromThing.color}
						position = 'absolute'
					/>
					&nbsp;{#if ancestor.hasMultipleParents}-{/if}&nbsp;
				</span>
			{/if}
			<Crumb relationship={ancestor}/>
		{/each}
	{/if}
{/key}
