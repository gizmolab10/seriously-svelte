<svelte:options immutable = {true} />

<script lang='ts'>
  import Widget from './Widget.svelte';
  import Idea from './Idea';
	export let idea = Idea;

  function handleInput(event) {
    idea.title = event.target.value;
  }
</script>

<input type='text' bind:value={idea.title} on:input={handleInput}/>

<style lang='scss'>
  input {
    border: none;
    border-radius: 10px;
    // size: value.<length>;
  }
</style>