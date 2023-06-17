<script lang="ts">
  import Idea from './Idea';
	import Dot from './Dot.svelte';
	import Text from './Text.svelte';
	export let idea = Idea;
</script>

<span>
	<Dot idea={idea}/> <Text idea={idea}/> <Dot idea={idea} isReveal={true}/>
</span>

<style lang="scss">
	span {
		padding: 10px;
	}
  span:hover {
		padding: 9px;
    border: 1px dashed red;
		border-radius: 20px;
  }
</style>
