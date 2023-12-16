<script lang='ts'>
	import { Thing, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { ids_grabbed, crumbsWidth } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grab: Thing;

	onDestroy( () => { signalHandler.disconnect(); });
	function thing_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.thing_lastGrabbed; }

	const signalHandler = handleSignalOfKind(Signals.children, (visited, idThing) => {
		updateAncestors($crumbsWidth);
		toggleDraw = !toggleDraw;
	})

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
				&nbsp;:
			{/if}
			<Crumb thing={thing}/>
		{/each}
	{/if}
{/key}
