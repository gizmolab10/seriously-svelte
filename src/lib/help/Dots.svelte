<script>
  import Widget from '../graph/Widget.svelte';
  import { exemplar } from '../data/Exemplar';
  import TextBox from '../kit/TextBox.svelte';
  export let visible = true;
</script>

<div>
<TextBox text='How the <b>Dots</b> work:'/>
<br>
    <div class='centered-container'>
      <Widget thing={exemplar}/>
    </div>
<ul class='help-ul'>
  <li class='help-li'>Click the dots (to right and left of each item) to display the items in the child [<b>browse right</b>] or parent list [<b>browse left</b>], respectively.
  <li class='help-li'>Hold the <i>Shift</i> key as you cli class='help-lick to <b>add or remove</b> that item from the set of selected items.
  <li class='help-li'>The dots on the left side are for <b>selecting</b> an item or <b>browsing left</b>.
  <li class='help-li'>The dots on the right side (if one is there) of each menu item let you <b>browse to the right</b>.
  <li class='help-li'><b>Hovering</b> over a dot will reverse its color,
</ul>
</div>

<style>
  @import './Help.css';
</style>
