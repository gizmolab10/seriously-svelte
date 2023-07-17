<svelte:options immutable = {true} />

<script lang='ts'>
  import { Thing, signal, handleSignal, SignalKinds } from '../common/imports.ts';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.widget)) {
			var style = document.getElementById(thing.id)?.style;
			style?.setProperty('--hoverAttributes', thing.hoverAttributes);
			style?.setProperty( '--grabAttributes', thing.grabAttributes);
			signal([SignalKinds.dot], thing.id); // pass signal along to its dots
		}
	});
</script>

<span id={thing.id}
	style='padding: 0px 8px 2px 0px;
				border-radius: 16px;
				border: var(--grabAttributes)'>
	<Dot thing={thing}/> <Title thing={thing}/> <Dot thing={thing} isReveal={true}/>
</span>
