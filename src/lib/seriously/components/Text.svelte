<svelte:options immutable = {true} />

<script lang='ts'>
  import { grabbing } from '../managers/Grabbing';
  import { editingID } from '../managers/Stores';
  import { onMount, onDestroy } from 'svelte';
  import Widget from './Widget.svelte';
  import Entity from '../data/Entity';
	export let entity = Entity;
  let unsubscribe;
  let input;

  function handleInput(event) { entity.title = event.target.value; }
  function handleBlur(event) { $editingID = undefined; }
  
  function subscribe() {
    unsubscribe = editingID.subscribe((editing) => {
      if ($editingID == entity.id) {
        setTimeout(() => {
          input.focus();
          console.log('EDIT:', entity.title);
        }, 10);
      }
    });
  }

  function handleFocus(event) {
    grabbing.grab(entity);
    console.log('FOCUS:', entity.title);

    $editingID = entity.id; // cause the input object to gain focus, so infinite recursion, BAAAAD!
  }

  function handleKeyDown(event) {
    if ($editingID == entity.id) {
      const COMMAND = event.metaKey;
      if (event.key == 'Enter') {
        input.blur();
        setTimeout(() => {
          $editingID = undefined;
          console.log('STOP:', entity.title);
        }, 20);
      }
    }
  }

  onMount(subscribe);
  onDestroy(unsubscribe);
</script>

<input
  type='text'
  id={entity.id}
  bind:this={input}
  onkeydown={handleKeyDown}
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