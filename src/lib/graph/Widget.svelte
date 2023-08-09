<script lang='ts'>
  import { Thing, Signals, signal, handleSignalOfKind, onDestroy } from '../common/GlobalImports';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;

	onDestroy( () => { signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.widgets, (value) => {
		signal(Signals.dots, thing.id); // pass signal along to its dots
		var style = document.getElementById(thing.id)?.style;
		style?.setProperty( '--color', thing.grabAttributes);
	});

</script>

<span id={thing.id}
	style='padding: 1px 8px 2px 1px;
				border-radius: 16px;
				border: var(--color)'>
	<Dot thing={thing} size=15/>
	<Title thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</span>
