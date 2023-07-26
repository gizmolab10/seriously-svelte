<script lang='ts'>
  import { Thing, things, editingID, signal, Signals } from '../common/GlobalImports.ts';
  import Widget from '../components/Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let inputRef = null;

  function needsSave() { return originalTitle != thing.title; }
  function make_notDirty() { originalTitle = thing.title; }
  
  function handleKeyDown(event) {
    if ($editingID == thing.id) {
      switch (event.key) {
        case 'Tab': stopEditing(true); thing.duplicate_refresh(); break;
        case 'Enter': stopEditing(true);
      }
    }
  }

  $: {  
    
    ///////////////////////
    // manage edit state //
    ///////////////////////
    
    setTimeout(() => {      // wait until the inputRef is bound instantiated and editingID is settled
      if ($editingID == thing.id) {
        if (document.querySelector('.input') != document.activeElement) {
          thing.grabOnly();
          inputRef.focus();
          inputRef.select();
        }
      } else if (needsSave()) {
        stopEditing(false); // false means leave editingID alone so other currently editing widgets continue editing
      };
      signal(Signals.widgets); // so widget will show as [un]grabbed
    }, 200);
  }

  function stopEditing(clearEditingID: boolean) {
    inputRef?.blur();
    if (needsSave()) {
      make_notDirty();
      things.updateThing_inCloud(thing);
    }
    if (clearEditingID) {
      setTimeout(() => { // WHY?
        $editingID = null;
      }, 20);
    }
  }

  function handleFocus(event) {
    thing.edit();
    thing.grabOnly()
    signal(Signals.widgets); // so widget will show as grabbed
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
    outline-color: 'white';
    padding: 0px 5px;
    border: none;
    border-radius: 10px;
    color: var(--textColor);
  }
</style>