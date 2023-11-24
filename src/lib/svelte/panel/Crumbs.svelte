<script lang='ts'>
	import { Thing, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idsGrabbed, windowWidth } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let ancestors: Array<Thing> = [];
	let toggleDraw = false;
	let grab: Thing;

	onDestroy( () => {signalHandler.disconnect(); });
	function thing_lastGrabbed() { return dbDispatch.db.hierarchy.grabs.thing_lastGrabbed; }

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
		updateAncestors($windowWidth);
		toggleDraw = !toggleDraw;
	})

	$: {
		if ($idsGrabbed || grab == null || ancestors.length == 0) {
			const thing = thing_lastGrabbed()	// start over with new grab
			if (thing) {
				grab = thing;
			}
		}
		updateAncestors($windowWidth);
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
