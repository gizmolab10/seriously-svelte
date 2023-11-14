<script lang='ts'>
	import { Thing, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idsGrabbed, windowSize } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grab: Thing;

	onDestroy( () => {signalHandler.disconnect(); });
	function thing_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.thing_lastGrabbed; }

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
		updateAncestors($windowSize.width);
		toggleDraw = !toggleDraw;
	})

	$: {
		if ($idsGrabbed || grab == null || ancestors.length == 0) {
			const thing = thing_lastGrabbed()	// start over with new grab
			if (thing) {
				grab = thing;
			}
		}
		updateAncestors($windowSize.width);
	}

	function updateAncestors(width: number) {
		if (grab) {
			ancestors = grab.ancestors(width - 250);
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
