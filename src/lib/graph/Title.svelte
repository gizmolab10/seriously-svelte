<script lang='ts'>
  import { Thing, cloud, editingID, onMount, signal, Signals } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let isEditing = false;
  let surround = null;
  let input = null;

  var hasChanges = () => { return originalTitle != thing.title; }
  function revertToOriginal() { originalTitle = thing.title; }
  onMount(async () => { updateInputWidth(); });

  function handleKeyDown(event) {
    if ($editingID == thing.id) {
      switch (event.key) {
        case 'Tab': stopEditing(true); cloud.thing_duplicate(); break;
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
      setTimeout(() => {
        input?.focus();
        input?.select();
      }, 10);
    }
  }

  function stopEditing(clearEditingID: boolean) {
    if (isEditing) {
      isEditing = false;
      input?.blur();
      if (hasChanges) {
        cloud.thing_save(thing);
        revertToOriginal();
      }
      if (clearEditingID) {
        setTimeout(() => {     // eliminate infinite recursion
          $editingID = null;
        }, 20);
      }
    }
  }

  function handleFocus(event) {
    if (!isEditing) {
      isEditing = true;
      thing.editTitle();
      thing.grabOnly()
    }
  }

  function updateInputWidth() {
    if (input && surround) {
      input.style.width = `${(surround.scrollWidth * 0.92) + thing.titlePadding - 5}px`;
    }
  }

  function handleInput(event) { thing.title = event.target.value; }
  function handleBlur(event) { stopEditing(true); updateInputWidth(); }
</script>

<div class="wrapper" bind:this={surround}>
  {thing.title} &nbsp;
</div>
<input
  type='text'
  id={thing.id}
  bind:this={input}
  on:blur={handleBlur}
  on:focus={handleFocus}
  on:input={handleInput}
  on:keydown={handleKeyDown}
  on:input={updateInputWidth}
  bind:value={thing.title}
  style='color: {thing.color};'/>

<style lang='scss'>
  input {
    border: none;
    outline: none;
    padding: 0px 3px;
    border-radius: 10px;
    outline-color: 'white';
  }
  .wrapper {
    position: absolute;
    visibility: hidden;
    white-space: pre; /* Preserve whitespace to accurately measure the width */
  }
</style>