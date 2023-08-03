<script lang='ts'>
  import { Thing, Signals, signal, handleSignalOfKind, onDestroy } from '../common/GlobalImports';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;

	onDestroy( () => { signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.grab, (value) => {
		signal(Signals.dots, thing.id); // pass signal along to its dots
		setTimeout(() => { // wait for here signal (elsewhere) to finish creating widget
			var style = document.getElementById(thing.id)?.style;
			style?.setProperty('--hoverAttributes', thing.hoverAttributes);
			style?.setProperty( '--grabAttributes', thing.grabAttributes);
		}, 1);
	});

	</script>

<span id={thing.id}
	style='padding: 1px 8px 2px 1px;
				border-radius: 16px;
				border: var(--grabAttributes)'>
	<Dot thing={thing}/>
	<Title thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} isReveal={true}/>
	{/if}
</span>
