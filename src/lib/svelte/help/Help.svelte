<script>
	import { popupViewID } from '../../ts/managers/State';
	import CloseButton from '../kit/CloseButton.svelte'
	import HelpButtons from './HelpButtons.svelte';
	export let size = 20;
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $popupViewID = null; break;
		}
	}
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="help-modal-overlay">
	<div class="help-modal-content">
		<CloseButton size={size}/>
		<h2>Welcome to Seriously</h2>
		<p>The Seriously <b>graph</b> is essentially a hierarchal menu system, to which you can <b>add</b> new items, and within which you can easily <b>browse</b> and <b>focus</b>.</p>
		<HelpButtons/>
		<div class='horizontal-line'></div>
	</div>
</div>

<style>
	@import '../../../styles/Help.css';
	.horizontal-line {
		position: absolute;
		left: 10px;
		top: 138px;
		height: 1px;
		width: 96%;
		background-color: lightgray;
	}
</style>
