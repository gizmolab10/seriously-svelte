<script lang='ts'>
	import { Thing, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere } from '../../ts/managers/State';
	import Crumb from '../kit/Crumb.svelte';
	let windowWidth = window.innerWidth;
	let ancestors: Array<Thing> = [];
	export let here: Thing;
	let toggleDraw = false;

	onDestroy( () => {signalHandler.disconnect(); });
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => { toggleDraw = !toggleDraw; })
	window.addEventListener('resize', () => { windowWidth = window.innerWidth; });

	$: {
		if (here == null || $idHere != here.id || ancestors.length == 0) {
			const h = dbDispatch.db.hierarchy;
			const thing = h.here;	// start over with new grab
			if (thing) {
				here = thing;
			}
		}
		if (here) {
			ancestors = here.ancestors(windowWidth - 50);
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
