<script lang='ts'>
  import { Thing, cloud, editingID, stoppedEditingID, onMount, signal, Signals } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let isEditing = false;
  let wrapper = null;
  let input = null;

  function revertTitleToOriginal() { originalTitle = thing.title; }
  var hasChanges = () => { return originalTitle != thing.title; }
  onMount(async () => { updateInputWidth(); });

  function handleKeyDown(event) {
    if ($editingID == thing.id) {
      switch (event.key) {
        case 'Tab': stopAndClearEditing(); cloud.thing_duplicate(); break;
        case 'Enter': stopAndClearEditing();
      }
    }
  }

  $: {

    ///////////////////////
    // manage edit state //
    ///////////////////////

    if ($stoppedEditingID == thing.id) {
      stopEditing();
      $stoppedEditingID = null;
    } else if ($editingID != thing.id) {
      stopEditing();
    } else if (!isEditing) {
      isEditing = true;
      thing.grabOnly();
      setTimeout(() => {
        input?.focus();
        input?.select();
      }, 10);
    }
  }

  function stopAndClearEditing() {
    stopEditing();
    setTimeout(() => {     // eliminate infinite recursion
      $editingID = null;
    }, 20);
  }

  function stopEditing() {
    if (isEditing) {
      $stoppedEditingID = $editingID;
      isEditing = false;
      input?.blur();
      if (hasChanges) {
        cloud.thing_save(thing);
        revertTitleToOriginal();
      }
    }
  }

  function handleFocus(event) {
    if (!isEditing) {
      isEditing = true;
      thing.startEdit();
      thing.grabOnly()
    }
  }

  function updateInputWidth() {
    if (input && wrapper) { // wrapper only exists to provide its scroll width
      input.style.width = `${(wrapper.scrollWidth * 0.93) + thing.titlePadding - 5}px`;
    }
  }

  function handleInput(event) { thing.title = event.target.value; }
  function handleBlur(event) { stopEditing(true); updateInputWidth(); }
</script>

<div class="wrapper" bind:this={wrapper}>
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