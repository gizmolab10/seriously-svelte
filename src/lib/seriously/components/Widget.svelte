<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, signal, handleSignal, SignalKinds } from '../common/imports.ts';
	import EntityEditor from './EntityEditor.svelte';
	import Dot from './Dot.svelte';
	export let entity = Entity;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.widget)) {
			var style = document.getElementById(entity.id)?.style;
			style?.setProperty('--hoverAttributes', entity.hoverAttributes);
			style?.setProperty( '--grabAttributes', entity.grabAttributes);
			signal([SignalKinds.dot], entity.id);
		}
	});
</script>

<span id={entity.id}
	style='padding: 5px 5px 7px 5px;
				border-radius: 20px;
				border: var(--grabAttributes)'>
	<Dot entity={entity}/> <EntityEditor entity={entity}/> <Dot entity={entity} isReveal={true}/>
</span>