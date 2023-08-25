<script>
  import { popupViewID } from '../managers/State';
  import Widget from '../graph/Widget.svelte'
  import { exemplar } from '../data/Exemplar'
  export let size = 20;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': $popupViewID = null; break;
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
      on:click={() => { $popupViewID = null; }}>
        ×
      </span>
    <h2>Welcome to Seriously</h2>
    <p>Seriously is essentially a hierarchal menu system, to which you can add new items.</p>
    <ul>
      <li><Widget thing={exemplar} style='justify-content: center'/>
    </ul>
    <ul style='list-style-type: circle'>
      <li>When an item is <b>selected</b>:
        <ul>
          <li>It is surrounded with a <b>border</b> (and its dots reverse their color).
          <li>To <b>edit</b> it, click on its text. You can also select it and tap the <i>Enter</i> key. When you finish editing, tap the <i>Enter</i> key [again] to save your changes.
          <li>To <b>add a child</b> item to it (and begin editing the child), and tap the <i>Space</i> key.
          <li>To <b>duplicate</b> it item (and begin to edit the duplicate), tap the <i>D</i> key.
          <li>To <b>delete</b> it, tap the <i>Delete</i> key.
          <li>To <b>move</b> it, hold the <i>Option</i> key tap an arrow key.
        </ul>
      <li><b>Browsing</b> (changing which item is selected):
        <ul>
          <li>To <b>browse</b>, tap the arrow keys (including up and down).
          <li>As you <b>browse</b>, buttons above the menu show your location in the hierarchy. You can click on them to quickly change your location.
        </ul>
      <li><b>Dots:</b>
        <ul>
          <li>Click the dots (to right and left of each item) to display the items in the child [<b>browse right</b>] or parent list [<b>browse left</b>], respectively.
          <li>Hold the <i>Shift</i> key as you click to <b>add or remove</b> that item from the set of selected items.
          <li>The dots on the left side are for <b>selecting</b> an item or <b>browsing left</b>.
          <li>The dots on the right side (if one is there) of each menu item let you <b>browse to the right</b>.
          <li><b>Hovering</b> over a dot will reverse its color,
        </ul>
      <li><b>Please,</b> bear in mind that the menu items are my test data. So, when you finish editing things, try to return everything to something close to its original state. <b>Thanks!</b>
    </ul>
  </div>
</div>

<style>
  b {
    color: blue;
    font-weight: normal;
  }
  i {
    color: darkred;
  }
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
    background-color: rgba(0, 0, 0, 0.1);
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
