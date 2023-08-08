<script>
  import Widget from '../graph/Widget.svelte'
  import { exemplar } from '../help/Exemplar'
  export let size = 20;
  export let onClose;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': onClose(); break;
    }
  }
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="modal-overlay">
  <div class="modal-content">
    <span class="close-button" style='
      width: {size}px;
      height: {size}px;
      font-size: {size - 1}px;;
      line-height: {size}px;'
      on:click={() => onClose()}>×</span>
    <h2>Welcome to Seriously</h2>
    <p>Seriously is essentially a hierarchal menu system, to which you can add new items.</p>
    <Widget thing={exemplar} style='justify-content: center'/>
    <ul>
      <li>Each selected item is surrounded with a border (and its dots reverse their color).
      <li>Browsing (changing which item is selected):
        <ul>
          <li>To browse, tap the arrow keys (including up and down).
          <li>As you browse, buttons above the menu show your location in the hierarchy. You can click on them to quickly change your location.
        </ul>
      <li>Dots:
        <ul>
          <li>Click the dots (to right and left of each item) to display the items in the child or parent list, respectively.
          <li>Hold the 'Shift' key as you click to add or remove an item from the set of selected items.
          <li>The dots on the left side are for selecting an item or browsing left.
          <li>The dots on the right side (if one is there) of each menu item browse to the right.
        </ul>
      <li>When an item is selected:
        <ul>
          <li>To edit it, click on its text. You can also select it and tap the 'Enter' key. When you finish editing, tap the 'Enter' key [again] to save your changes.
          <li>to add a child item to it, and tap the 'Space' key.
          <li>To duplicate it item (and begin to edit the duplicate), tap the 'D' key.
          <li>To delete it, tap the 'Delete' key.
          <li>To move it, hold the 'Option' key tap an arrow key.
        </ul>
      <li>Please bear in mind that the menu items are my test data. So, when you finish editing things, try to return everything to something close to its original state. Thanks!
    </ul>
  </div>
</div>

<style>
  ul {
    list-style-type: number;
    line-height: 1.2;
  }

  li {
    margin-top: 0.2em;
    padding-bottom: 0.3em;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    position: relative;
    font-size: 0.8em;
  }

  .close-button {
    display: inline-block;
    text-align: center;
    cursor: pointer;
    color: #000;
    position: absolute;
    border: 1px solid black;
    border-radius: 50%;
    top: 10px;
    right: 10px;
  }
</style>
