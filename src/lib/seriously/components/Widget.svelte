<svelte:options immutable = {true} />

<script lang="ts">
  import Idea from '/src/lib/seriously/data/Idea';
	import Text from './Text.svelte';
	import Dot from './Dot.svelte';
	export let idea = Idea;
	let toggle = false;
  function updateWidget() {
		toggle = !toggle;
		console.log('updating colors: ', idea.title, idea.hoverColor(false));
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

<style lang="scss">
	#widget {
		padding: 5px;
		border-color: var(--grabColor);
		&:hover {
			padding: 3px;
			border: 3px solid;
			border-color: var(--hoverColor);
  	}
	}
</style>
