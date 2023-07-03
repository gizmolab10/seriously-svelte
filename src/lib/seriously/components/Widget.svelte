<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, signal, handleSignal, SignalKinds } from '../common/imports.ts';
	import Text from './Text.svelte';
	import Dot from './Dot.svelte';
	export let entity = Entity;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.widget)) {
			var style = document.getElementById(entity.id)?.style;
			style?.setProperty('--hoverAttributes', entity.hoverAttributes);
			style?.setProperty( '--grabAttributes', entity.grabAttributes);
			signal([SignalKinds.dot]);
		}
	});
</script>

<span id={entity.id}
	style='padding: 5px;
				 border-radius: 20px;
				 border: var(--grabAttributes);
				 --hoverAttributes: {entity.hoverAttributes};
         --grabAttributes:  {entity.grabAttributes}'>
	<Dot entity={entity}/> <Text entity={entity}/> <Dot entity={entity} isReveal={true}/>
</span>

<style lang='scss'>
	.span:hover {
		padding: 3px;
		border: var(--hoverAttributes);
	}
</style>
