<script lang='ts'>
  import { Thing, things, editingID, signal, Signals } from '../common/GlobalImports.ts';
  import Widget from '../components/Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let isEditing = false;
  let inputRef = null;

  var needsSave = () => { return originalTitle != thing.title; }
  function markAsSaved() { originalTitle = thing.title; }
  
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

    if ($editingID != thing.id) {
      stopEditing(false); // false means leave editingID alone so other currently editing widgets continue editing
    } else if (!isEditing) {
      isEditing = true;
      thing.grabOnly();
      inputRef.focus();
      inputRef.select();
    }
    signal(Signals.widgets); // so widget will show as [un]grabbed
  }

  function stopEditing(clearEditingID: boolean) {
    if (isEditing) {
      if (clearEditingID) {
        setTimeout(() => {     // eliminate infinite recursion
          $editingID = null;
        }, 10);
      }
      isEditing = false;
      inputRef?.blur();
      if (needsSave) {
        markAsSaved();
        things.updateThing_inCloud(thing);
      }
    }
  }

  function handleFocus(event) {
    if (!isEditing) {
      isEditing = true;
      thing.edit();
      thing.grabOnly()
      signal(Signals.widgets); // so widget will show as grabbed
    }
  }

  function handleInput(event) { thing.title = event.target.value; }
  function handleBlur(event) { stopEditing(true); }
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