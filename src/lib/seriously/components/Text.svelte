<svelte:options immutable = {true} />

<script lang='ts'>
  import { states, WorkState, setWorkState } from '../managers/States'
  import { editingID } from '../managers/Stores';
  import { onMount, onDestroy } from 'svelte';
  import Widget from './Widget.svelte';
  import Idea from '../data/Idea';
	export let idea = Idea;

  $: if (idea.isGrabbed) {
    let _ = true;
  }
  
  const unsubscribe = editingID.subscribe((editing) => {
    if (editing == idea.id) {
      console.log('TEXT:', editing);
    }
  });
  
  function handleInput(event) {
    idea.title = event.target.value;
  }

  function handleFocus(event) {
    // editor.edit(idea.id); // cause the input object to gain focus, so infinite recursion, BAAAAD!
  }

  onDestroy(unsubscribe);

  // onMount(async () => {
  //   console.log(editingID);
  //   editingID.subscribe(value => {});
  //     id = value;
  //     if (value == idea.id) {
  //       console.log(value);
  //     }
  //   }
  // });

</script>

<input
  type='text'
  id={idea.id}
  on:input={handleInput}
  on:focus={handleFocus}
  bind:value={idea.title}
  style='--textColor: {idea.color}'/>

<style lang='scss'>
  input {
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>