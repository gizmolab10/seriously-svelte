<svelte:options immutable = {true} />

<script lang='ts'>
  import { states, WorkState, setWorkState } from '../managers/States'
  import { grabbing } from '../managers/Grabbing';
  import { editingID } from '../managers/Stores';
  import { onMount, onDestroy } from 'svelte';
  import Widget from './Widget.svelte';
  import Idea from '../data/Idea';
	export let idea = Idea;
  let input;

  function isEditable(): boolean {
    return $editingID == idea.id;
  }
  
  const unsubscribe = editingID.subscribe((editing) => {
    if (isEditable()) {
      input.focus();
    }
  });

  function handleInput(event) {
    idea.title = event.target.value;
  }

  function handleFocus(event) {
    grabbing.grab(idea);

    $editingID = idea.id; // cause the input object to gain focus, so infinite recursion, BAAAAD!
  }

  function handleKeyDown(event) {
    if (isEditable) {
      const COMMAND = event.metaKey;
      if (event.key == 'Enter') {
        input.blur();
      }

      console.log('TEXT:', COMMAND);
    }
  }

  function handleBlur(event) {
    $editingID = undefined;
  }

  addEventListener('keydown', handleKeyDown);

  onDestroy(unsubscribe);

</script>

<input
  type='text'
  id={idea.id}
  bind:this={input}
  oninput={handleInput}
  onfocus={handleFocus}
  onblur={handleBlur}
  bind:value={idea.title}
  style='--textColor: {idea.color}'/>

<style lang='scss'>
  input {
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>