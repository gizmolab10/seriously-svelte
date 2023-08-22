<script lang='ts'>
  import { Thing, cloud, editor, signal, Signals, onDestroy } from '../common/GlobalImports';
  import { editingID, stoppedEditingID } from '../managers/State';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let originalTitle = thing.title;
  let currentThing = Thing;
  let isEditing = false;
  let wrapper = null;
  let input = null;

  var hasChanges = () => { return originalTitle != thing.title; }
  function handleInput(event) { thing.title = event.target.value; }
  function handleBlur(event) { stopAndClearEditing(false); updateInputWidth(); }
  onDestroy(() => { thing = null; });

  function handleKeyDown(event) {
    if ($editingID == thing.id) {
      switch (event.key) {
        case 'Tab': stopAndClearEditing(); editor.thing_duplicate(); break;
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
    if (currentThing != thing) {
      currentThing = thing;
      setTimeout(() => {
        updateInputWidth();
      }, 1);
    }
  }

  function stopAndClearEditing(invokeBlur: boolean = true) {
    stopEditing(invokeBlur);
    setTimeout(() => {     // eliminate infinite recursion
      $editingID = null;
    }, 20);
  }

  function stopEditing(invokeBlur: boolean = true) {
    if (isEditing) {
      $stoppedEditingID = $editingID;
      isEditing = false;
      if (invokeBlur) {
        input?.blur();
      }
      if (hasChanges()) {
        thing.needsUpdate(true);
        originalTitle = thing.title;    // so hasChanges will be correct
        signal(Signals.childrenOf, thing.firstParent.id); // for crumbs
        cloud.handleAllNeeds();
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
</script>

{#key originalTitle}
  <div class="wrapper" bind:this={wrapper}>
    {thing.title} &nbsp;
  </div>
  <input
    type='text'
    bind:this={input}
    on:blur={handleBlur}
    on:focus={handleFocus}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:input={updateInputWidth}
    bind:value={thing.title}
    style='color: {thing.color};'/>
{/key}

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