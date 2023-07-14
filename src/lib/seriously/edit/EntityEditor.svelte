<svelte:options immutable = {true} />

<script lang='ts'>
  import { Entity, entities, editingID, grabbing, graphEditor, signal, SignalKinds } from '../common/imports.ts';
  import Widget from '../components/Widget.svelte';
  export let entity = Entity;
  let originalTitle = entity.title;
  let input;

  function isDirty() { return originalTitle != entity.title; }
  function makeClean() { originalTitle = entity.title; }
  
  function handleKeyDown(event) {
    if ($editingID == entity.id) {
      switch (event.key) {
        case 'Tab': graphEditor.addSibling(); break;
        case 'Enter': stopEditing(true);
      }
    }
  }

  $: {  
    
    ///////////////////
    // state machine //
    ///////////////////
    
    setTimeout(() => {     // wait until the input element is fully instantiated and editingID is settled
      if ($editingID == entity.id) {
        input.focus();
      } else {
        stopEditing(false); // false means leave editingID alone so other currently editing widgets continue editing
      };
      signal([SignalKinds.widget], null); // so widget will show as [un]grabbed
    }, 50);
  }

  function stopEditing(needsStore: boolean) {
    input?.blur();
    if (isDirty()) {
      makeClean();
      entities.updateToCloud(entity);
    }
    if (needsStore) {
      setTimeout(() => { // WHY?
        $editingID = null;
      }, 20);
    }
  }

  function handleFocus(event) {
    $editingID = entity.id;
    grabbing.grabOnly(entity)
    signal([SignalKinds.widget], null); // so widget will show as grabbed
  }

  function handleInput(event) { entity.title = event.target.value; }
  function handleBlur(event) { $editingID = null; }
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