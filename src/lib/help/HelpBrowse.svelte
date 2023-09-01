<script>
  import TextBox from '../kit/TextBox.svelte';
  export let visible = true;
</script>

<div>
  <TextBox text='<b>Browsing</b> (changing which item is selected):'/>
  <ul class='help-ul'>
    <li class='help-li'>To <b>browse</b>, tap the arrow keys (including up and down).
    <li class='help-li'>As you <b>browse</b>, buttons above the menu show your location in the hierarchy. You can click on them to quickly change your location.
  </ul>
</div>

<style>
  @import './Help.css';
</style>
