<script lang='ts'>
  import { Thing, Signals, signal, handleSignalOfKind } from '../common/GlobalImports.ts';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;

  handleSignalOfKind(Signals.widgets, (value) => {
		signal(Signals.dots, thing.id); // pass signal along to its dots
		var style = document.getElementById(thing.id)?.style;
		style?.setProperty('--hoverAttributes', thing.hoverAttributes);
		style?.setProperty( '--grabAttributes', thing.grabAttributes);
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
