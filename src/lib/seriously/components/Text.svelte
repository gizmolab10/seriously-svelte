<svelte:options immutable = {true} />

<script lang='ts'>
  import { signal, SignalKinds } from '../managers/Signals';
  import { editingID } from '../managers/Editing';
  import { grabbing } from '../managers/Grabbing';
  import { entities } from '../managers/Entities';
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
      setTimeout(() => {     // need to wait for the input element to be fully instantiated
        if ($editingID == entity.id) {
          input.focus();
          console.log('EDIT:', entity.title);
        } else {
          input.blur();
          entities.update(entity);
        }
      }, 50);    // fast but long enough to let the store settle down
    });
  }

  function handleFocus(event) {
    $editingID = entity.id;
    entity.grabOnly();
    signal([SignalKinds.widget], null); // so widget will show as grabbed
  }

  function handleKeyDown(event) {
    if ($editingID == entity.id) {
      // const COMMAND = event.metaKey;
      if (event.key == 'Enter') {
        input.blur();
        console.log('STOP:', entity.title);
        setTimeout(() => { // need to wait so subscribe still matches the editingID
          $editingID = undefined;
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
  on:blur={handleBlur}
  on:focus={handleFocus}
  on:input={handleInput}
  on:keydown={handleKeyDown}
  bind:value={entity.title}
  style='--textColor: {entity.color}'/>

<style lang='scss'>
  input {
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>