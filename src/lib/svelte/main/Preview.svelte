<script lang='ts'>
	import { h, k, show } from '../../ts/common/Global_Imports';
	import { T_Database } from '../../ts/database/DB_Common';
	import DB_Filesystem from '../../ts/database/DB_Filesystem';
	const { w_id_popupView, w_preview_content, w_preview_type, w_preview_filename } = show;

	function dismiss_popup() {
		$w_id_popupView = null;
		$w_preview_content = null;
	}

	async function downloadFile() {
		if (!(h.db instanceof DB_Filesystem)) return;
		const thing = h.things.find(t => t.title === $w_preview_filename);
		if (thing) {
			await h.db.downloadFile(thing.id);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dismiss_popup();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class='preview-overlay'
	style='
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.7);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;'
	on:click={dismiss_popup}
	role="button"
	tabindex="0">
	<div class='preview-content'
		style='
			background: white;
			padding: 20px;
			border-radius: 8px;
			max-width: 80vw;
			max-height: 80vh;
			overflow: auto;'
		on:click|stopPropagation
		on:keydown|stopPropagation>
		<div style='display: flex; justify-content: space-between; margin-bottom: 10px;'>
			<span style='font-weight: bold;'>{$w_preview_filename}</span>
			<div>
				{#if h.db instanceof DB_Filesystem}
					<button on:click={downloadFile} style='margin-right: 10px; cursor: pointer;'>Download</button>
				{/if}
				<button on:click={dismiss_popup} style='cursor: pointer;'>Close</button>
			</div>
		</div>
		{#if $w_preview_type === 'image' && $w_preview_content}
			<img src={$w_preview_content} alt='Preview' style='max-width: 100%; max-height: 70vh;'/>
		{:else if $w_preview_type === 'text' && $w_preview_content}
			<pre style='white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 70vh; overflow: auto;'>{$w_preview_content}</pre>
		{:else}
			<p>{$w_preview_content}</p>
		{/if}
	</div>
</div>
