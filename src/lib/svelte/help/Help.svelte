<script>
	import { s_dot_size, s_id_popupView } from '../../ts/managers/State';
	import CloseButton from '../kit/CloseButton.svelte'
	import HelpTopics from './HelpTopics.svelte';
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $s_id_popupView = null; break;
		}
	}
</script>

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

<svelte:document on:keydown={handleKeyDown} />
<div class="help-modal-overlay">
	<div class="help-modal-content">
		<CloseButton size={$s_dot_size * 1.5}/>
		<h2>Welcome to Seriously</h2>
		<p>The Seriously <b>graph</b> is essentially a hierarchal menu system, to which you can <b>add</b> new items, and within which you can easily <b>browse</b> and <b>focus</b>.</p>
		<HelpTopics/>
		<div class='horizontal-line'></div>
	</div>
</div>
