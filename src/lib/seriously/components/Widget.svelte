<svelte:options immutable = {true} />

<script lang='ts'>
	import { updateWidgets } from '../managers/Signals';
	import Text from './Text.svelte';
  import Entity from '../data/Entity';
	import Dot from './Dot.svelte';
	export let idea = Entity;

	updateWidgets.connect((text, Object) => {
    var widget = document.getElementById(idea.id)?.style;
    widget?.setProperty('--hoverColor', idea.hoverColor( true));
    widget?.setProperty( '--grabColor', idea.hoverColor(false));
	});
</script>

<span id={idea.id}
	style='padding: 5px;
				 border-radius: 20px;
				 border: 3px solid var(--grabColor);
				 --hoverColor: {idea.hoverColor( true)};
         --grabColor:  {idea.hoverColor(false)}'>
	<Dot entity={idea}/> <Text entity={idea}/> <Dot entity={idea} isReveal={true}/>
</span>

<style lang='scss'>
	.span:hover {
		padding: 3px;
		border: 3px dashed var(--hoverColor);
	}
</style>
