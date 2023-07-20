<svelte:options immutable = {true} />

<script lang='ts'>
  import { Thing, things, editingID, grabbing, signal, SignalKinds } from '../common/imports.ts';
  import Widget from '../components/Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let inputRef = null;

  function isDirty() { return originalTitle != thing.title; }
  function makeClean() { originalTitle = thing.title; }
  
  function handleKeyDown(event) {
    if ($editingID == thing.id) {
      switch (event.key) {
        case 'Tab': stopEditing(true); break; // graphEditor.addSiblingAndRedraw(); break; // TODO: rewire
        case 'Enter': stopEditing(true);
      }
    }
  }

  $: {  
    
    ////////////////////////////////
    // title editor state machine //
    ////////////////////////////////
    
    setTimeout(() => {      // wait until the inputRef is bound instantiated and editingID is settled
      if ($editingID == thing.id) {
        if (document.querySelector('.input') != document.activeElement) {
          inputRef.focus();
        }
      } else if (isDirty()) {
        stopEditing(false); // false means leave editingID alone so other currently editing widgets continue editing
      };
      signal([SignalKinds.widget], null); // so widget will show as [un]grabbed
    }, 200);
  }

  function stopEditing(clearEditingID: boolean) {
    inputRef?.blur();
    if (isDirty()) {
      makeClean();
      thing.isDirty = true;
      things.updateThingInCloud(thing);
    }
    if (clearEditingID) {
      setTimeout(() => { // WHY?
        $editingID = null;
      }, 20);
    }
  }

  function handleFocus(event) {
    $editingID = thing.id;
    grabbing.grabOnly(thing)
    signal([SignalKinds.widget], null); // so widget will show as grabbed
  }

  function handleInput(event) { thing.title = event.target.value; }
  function handleBlur(event) { $editingID = null; }
</script>

<input
  type='text'
  id={thing.id}
  bind:this={inputRef}
  on:blur={handleBlur}
  on:focus={handleFocus}
  on:input={handleInput}
  on:keydown={handleKeyDown}
  bind:value={thing.title}
  style='--textColor: {thing.color};'/>

<style lang='scss'>
  input {
    padding: 0px 5px;
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>