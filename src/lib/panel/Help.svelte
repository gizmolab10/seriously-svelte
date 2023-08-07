<script>
  import { onMount, onDestroy } from '../common/GlobalImports';
  export let size = 20;
  export let onClose;
  let listener;

  onDestroy( () => { window.removeEventListener('keydown', listener); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': onClose(); break;
    }
  }
</script>

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
    <ul>
      <li>To browse around, click the dots (to right and left of each item) or tap the arrow keys (including up and down). Each item selected is surrounded with a border (and its dots reverse their color).
      <li>As you browse, buttons above the menu show your location in the hierarchy. You can click on them to quickly change your location.
      <li>To edit an existing item, click on its text. You can also select it and tap the 'Enter' key. When you finish editing, tap the 'Enter' key [again] to save your changes.
      <li>The dots on the right side of each menu item browse to the right.
      <li>The dots on the left side are for selecting an item or browsing left.
      <li>To add a child item, select the item to which you want to add a child, and tap the SPACE key.
      <li>To duplicate an existing item (and begin to edit it), select it and tap the 'D' key.
      <li>To delete an existing item, select it and tap the 'Delete' key.
      <li>To move an existing item, select it and hold the 'Option' key tap an arrow key.
      <li>Please bear in mind that the menu items are my test data. So, when you finish editing things, try to return everything to something close to its original state. Thanks!
    </ul>
  </div>
</div>

<style>
  ul {
    list-style-type: circle;
    line-height: 1.2;
    padding-right: 20px;
  }

  li {
    margin-top: 0.5em;
    padding-bottom: 0.5em;
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
