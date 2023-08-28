<script>
  import Widget from '../graph/Widget.svelte';
  import { exemplar } from '../data/Exemplar';
  import TextBox from '../kit/TextBox.svelte';
  export let visible = true;
</script>

<TextBox text='When an item is <b>selected</b>:'/>
<br>
  <div class='centered-container'>
    <Widget thing={exemplar}/>
  </div>
<ul class='help-ul'>
  <li class='help-li'>It is surrounded with a <b>border</b> (and its dots reverse their color).
  <li class='help-li'>To <b>edit</b> it, click on its text (try it on the item above). You can also select it and tap the <i>Enter</i> key. When you finish editing, tap the <i>Enter</i> key [again] to save your changes.
  <li class='help-li'>To <b>add a child</b> item to it (and begin editing the child), and tap the <i>Space</i> key.
  <li class='help-li'>To <b>duplicate</b> an item (and begin to edit the duplicate), tap the <i>D</i> key.
  <li class='help-li'>To <b>delete</b> it, tap the <i>Delete</i> key.
  <li class='help-li'>To <b>move</b> it, hold the <i>Option</i> key tap an arrow key.
</ul>

<style></style>
