<script lang="ts">
  import Idea from './Idea';
  import Widget from './Widget.svelte';
	export let idea = Idea;
  // export let widget = Widget;
  // console.log("widget: ", widget)
  // let title = () => { return widget }

  function handleInput(event) {
    idea.title = event.target.value;
  }
</script>

<label>
  <input type="text" bind:value={idea.title} on:input={handleInput} style = "border-radius: 10px; border: none;"/>
</label>


