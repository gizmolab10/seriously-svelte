<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, entities, editingID, grabbing, signal, SignalKinds } from '../common/imports.ts';
  import Widget from './Widget.svelte';
	export let entity = Entity;
  let input;
  
  $: {
    setTimeout(() => {     // wait until the input element is fully instantiated and editingID is settled
      if ($editingID == entity.id) {
        input.focus();
      } else {
        input.blur();
        entities.updateToCloud(entity); // TODO: PERFORMANCE only update if dirty
      };
      signal([SignalKinds.widget], null); // so widget will show as [un]grabbed
    }, 50);
  }

  function handleFocus(event) {
    $editingID = entity.id;
    grabbing.grabOnly(entity)
    signal([SignalKinds.widget], null); // so widget will show as grabbed
  }

  function handleKeyDown(event) {
    if ($editingID == entity.id) {
      if (event.key == 'Enter') {
        input.blur();
        entities.updateToCloud(entity);
        setTimeout(() => { // need to wait so subscribe still matches the editingID
          $editingID = undefined;
        }, 20);
      }
    }
  }

  function handleInput(event) { entity.title = event.target.value; }
  function handleBlur(event) { $editingID = undefined; }
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
  style='--textColor: {entity.color};'/>

<style lang='scss'>
  input {
    padding: 0px 5px;
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>