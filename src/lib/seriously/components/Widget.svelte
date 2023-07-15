<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, signal, handleSignal, SignalKinds } from '../common/imports.ts';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let entity = Entity;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.widget)) {
			var style = document.getElementById(entity.entityID)?.style;
			style?.setProperty('--hoverAttributes', entity.hoverAttributes);
			style?.setProperty( '--grabAttributes', entity.grabAttributes);
			signal([SignalKinds.dot], entity.entityID); // pass signal along to its dots
		}
	});
</script>

<span id={entity.entityID}
	style='padding: 0px 8px 2px 0px;
				border-radius: 16px;
				border: var(--grabAttributes)'>
	<Dot entity={entity}/> <Title entity={entity}/> <Dot entity={entity} isReveal={true}/>
</span>
