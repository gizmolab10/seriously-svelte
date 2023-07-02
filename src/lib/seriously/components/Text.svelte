<svelte:options immutable = {true} />

<script lang='ts'>
  import { states, WorkState, setWorkState } from '../managers/States'
  import { grabbing } from '../managers/Grabbing';
  import { editingID } from '../managers/Stores';
  import { onMount, onDestroy } from 'svelte';
  import Widget from './Widget.svelte';
  import Entity from '../data/Entity';
	export let entity = Entity;
  let input;

  function isEditable(): boolean { return $editingID == entity.id; }
  function handleInput(event) { entity.title = event.target.value; }
  function handleBlur(event) { $editingID = undefined; }
  
  const unsubscribe = editingID.subscribe((editing) => {
    if (isEditable()) {
      // console.log('TEXT:', entity, input);
      input.focus();
    }
  });

  function handleFocus(event) {
    grabbing.grab(entity);

    $editingID = entity.id; // cause the input object to gain focus, so infinite recursion, BAAAAD!
  }

  function handleKeyDown(event) {
    if (isEditable) {
      const COMMAND = event.metaKey;
      if (event.key == 'Enter') {
        input.blur();
      }
    }
  }

  addEventListener('keydown', handleKeyDown);
  onDestroy(unsubscribe);
</script>

<input
  type='text'
  id={entity.id}
  bind:this={input}
  oninput={handleInput}
  onfocus={handleFocus}
  onblur={handleBlur}
  bind:value={entity.title}
  style='--textColor: {entity.color}'/>

<style lang='scss'>
  input {
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>