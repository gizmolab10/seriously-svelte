<script lang='ts'>
	import { Thing, Grabs, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idsGrabbed } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let windowWidth = window.innerWidth;
	let ancestors: Array<Thing> = [];
	export let grab: Thing;
	let toggleDraw = false;

	onDestroy( () => {signalHandler.disconnect(); });
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => { toggleDraw = !toggleDraw; })
	window.addEventListener('resize', () => { windowWidth = window.innerWidth; });

	$: {
		if (!$idsGrabbed?.includes(grab?.id) || ancestors.length == 0) {
			const h = dbDispatch.db.hierarchy;
			let id = h.grabs.last_idGrabbed;
			const thing = h.getThing_forID(id);	// start over with new grab
			if (thing) {
				grab = thing;
			}
		}
		if (grab) {
			ancestors = grab.ancestors(windowWidth - 50);
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
