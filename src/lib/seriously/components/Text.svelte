<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, entities, editingID, onMount, onDestroy, signal, SignalKinds } from '../common/imports.ts';
  import Widget from './Widget.svelte';
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
          console.log('AUTO EDIT:', entity.lineAttribute, entity.title);
        } else {
          input.blur();
          entities.updateToCloud(entity);
          console.log('AUTO     :', entity.lineAttribute, entity.title);
        }
        signal([SignalKinds.widget], null); // so widget will show as [un]grabbed
      }, 50);    // wait long enough to let editingID to update before reading it
    });
  }

  function handleFocus(event) {
    $editingID = entity.id;
    entity.grabOnly();
    signal([SignalKinds.widget], null); // so widget will show as grabbed
    // console.log('EDIT:', entity.title, entity.lineAttribute);
  }

  function handleKeyDown(event) {
    if ($editingID == entity.id) {
      // const COMMAND = event.metaKey;
      if (event.key == 'Enter') {
        input.blur();
        entities.updateToCloud(entity);
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