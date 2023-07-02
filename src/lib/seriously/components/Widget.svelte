<svelte:options immutable = {true} />

<script lang='ts'>
	import { handleSignal, signal, SignalKinds } from '../managers/Signals';
	import Entity from '../data/Entity';
	import Text from './Text.svelte';
	import Dot from './Dot.svelte';
	export let entity = Entity;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.widget)) {
			var widget = document.getElementById(entity.id)?.style;
			widget?.setProperty('--hoverColor', entity.hoverColor( true));
			widget?.setProperty( '--grabColor', entity.hoverColor(false));
			signal([SignalKinds.dot]);
		}
	});
</script>

<span id={entity.id}
	style='padding: 5px;
				 border-radius: 20px;
				 border: 3px solid var(--grabColor);
				 --hoverColor: {entity.hoverColor( true)};
         --grabColor:  {entity.hoverColor(false)}'>
	<Dot entity={entity}/> <Text entity={entity}/> <Dot entity={entity} isReveal={true}/>
</span>

<style lang='scss'>
	.span:hover {
		padding: 3px;
		border: 3px dashed var(--hoverColor);
	}
</style>
