<svelte:options immutable = {true} />

<script lang='ts'>
	import { updateWidgets } from '../managers/Signals';
	import Text from './Text.svelte';
  import Entity from '../data/Entity';
	import Dot from './Dot.svelte';
	export let entity = Entity;

	updateWidgets.connect((text, Object) => {
    var widget = document.getElementById(entity.id)?.style;
    widget?.setProperty('--hoverColor', entity.hoverColor( true));
    widget?.setProperty( '--grabColor', entity.hoverColor(false));
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
