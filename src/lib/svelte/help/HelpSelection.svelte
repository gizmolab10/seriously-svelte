<script>
	import { exemplar } from '../../ts/data/Exemplar';
	import Widget from '../graph/Widget.svelte';
</script>

<div>
	<br>
	<div class='centered-container'>
		<Widget thing={exemplar}/>
	</div>
	<br>
	<ul class='help-ul'>
		<li class='help-li'>It is surrounded with a <b>border</b> (and its dots reverse their color).
		<li class='help-li'>To <b>edit</b> it, click on its text (try it on the item above). You can also select it and tap the <i>Enter</i> key. When you finish editing, tap the <i>Enter</i> key [again] to save your changes.
		<li class='help-li'>To <b>add a child</b> item to it (and begin editing the child), tap the <i>Space</i> key.
		<li class='help-li'>To <b>duplicate</b> an item (and begin to edit the duplicate), tap the <i>D</i> key.
		<li class='help-li'>To <b>delete</b> it, tap the <i>Delete</i> key.
		<li class='help-li'>To <b>move</b> it, hold the <i>Option</i> key tap an arrow key.
		<li class='help-li'>To add a <b>line</b>, tap the <i>Hyphen</i> key.
	</ul>
</div>

<style>
	@import '../../../styles/Help.css';
</style>
