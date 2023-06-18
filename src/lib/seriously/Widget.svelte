<svelte:options immutable = {true} />

<script lang="ts">
	import Text from './Text.svelte';
	import Dot  from './Dot.svelte';
  import Idea from './Idea';
	export let idea = Idea;
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
