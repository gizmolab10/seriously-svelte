<script lang='ts'>
	import { Thing, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idsGrabbed, windowSize } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grab: Thing;

	onDestroy( () => {signalHandler.disconnect(); });
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
		toggleDraw = !toggleDraw;
	})

	$: {
		if ($idsGrabbed || grab == null || ancestors.length == 0) {
			const h = dbDispatch.db.hierarchy;
			const thing = h.grabs.last_thingGrabbed;	// start over with new grab
			if (thing) {
				grab = thing;
			}
		}
		if (grab) {
			ancestors = grab.ancestors($windowSize.width - 250);
			toggleDraw = !toggleDraw;
		}
	}
</script>

{#key toggleDraw}
	{#if ancestors.length > 0}
		{#each ancestors as thing, index}
			{#if index > 0}
				&nbsp; &gt; 
			{/if}
			<Crumb thing={thing}/>
		{/each}
	{/if}
{/key}
