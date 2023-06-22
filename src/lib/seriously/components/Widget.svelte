<svelte:options immutable = {true} />

<script lang="ts">
  import Idea from '/src/lib/seriously/data/Idea';
	import Text from './Text.svelte';
	import Dot  from './Dot.svelte';
	export let idea = Idea;

	// console.log("WIDGET: ", idea);
</script>

<span>
	<Dot idea={idea}/> <Text idea={idea}/> <Dot idea={idea} isReveal={true}/>
</span>

<style lang="scss">
	span {
		padding: 5px;
	}
  span:hover {
		padding: 4px;
		border: 1px dashed variables.$globalHighlightColor;
		border-radius: 20px;
  }
</style>
