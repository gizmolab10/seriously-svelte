<svelte:options immutable = {true} />

<script lang="ts">
	import { SignalAction, signal } from "../data/Signal";
	import Text from './Text.svelte';
  import Idea from '../data/Idea';
	import Dot from './Dot.svelte';
	export let idea = Idea;

	signal.connect((action, text, Object) => {
		if (action == SignalAction.relayout) {
			updateWidget();
		}
	});

	function updateWidget() {
    var widget = document.getElementById(idea.id)?.style;
    widget?.setProperty('--hoverColor', idea.hoverColor( true));
    widget?.setProperty( '--grabColor', idea.hoverColor(false));
	};
</script>

<span id={idea.id}
	style='padding: 5px;
				 border-radius: 20px;
				 border: 3px solid var(--grabColor);
				 --hoverColor: {idea.hoverColor( true)};
         --grabColor:  {idea.hoverColor(false)}'>
	<Dot idea={idea} updateWidget={updateWidget}/> <Text idea={idea}/> <Dot idea={idea} updateWidget={updateWidget} isReveal={true}/>
</span>

<style lang='scss'>
	.span:hover {
		padding: 3px;
		border: 3px dashed var(--hoverColor);
	}
</style>
