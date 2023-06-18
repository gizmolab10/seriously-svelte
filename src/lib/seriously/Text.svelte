<svelte:options immutable = {true} />

<script lang='ts'>
  import Widget from './Widget.svelte';
  import Idea from './Idea';
	export let idea = Idea;

  function handleInput(event) {
    idea.title = event.target.value;
  }
</script>

<label>
  <input type='text' bind:value={idea.title} on:input={handleInput} style = "border-radius: 10px; border: none;"/>
</label>

<style lang='scss'>
  input {
    min-width: 10px
  }
  label {
    min-width: 10px
  }
</style>