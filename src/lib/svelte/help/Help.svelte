<script>
	import { s_dot_size, s_id_popupView } from '../../ts/managers/State';
	import CloseButton from '../kit/CloseButton.svelte'
	import HelpButtons from './HelpButtons.svelte';
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $s_id_popupView = null; break;
		}
	}
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="help-modal-overlay">
	<div class="help-modal-content">
		<CloseButton size={$s_dot_size * 1.5}/>
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
		width: 90%;
		background-color: lightgray;
	}
</style>
