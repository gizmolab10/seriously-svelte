<script lang="ts">
	import { onMount } from 'svelte';

	let messages: string[] = ["[DEBUG] Console Initialized"];

	const maxLines = 100;

	function log(message: string) {
		messages = [...messages, message].slice(-maxLines);
	}

	function clear() {
		messages = ["[DEBUG] Console Cleared"];
	}

	onMount(() => {
		const handler = (e: MessageEvent) => {
			try {
				const origin = e.origin.replace(/^https?:\/\//, '');
				const type = e.data?.type || "UNKNOWN";
				const pretty = JSON.stringify(e.data, null, 2);
				log(`[MSG from ${origin} | ${type}]\n${pretty}`);
			} catch (err) {
				log(`[ERROR parsing message] ${err}`);
			}
		};

		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	});
</script>

<div class="overlay">
	<button class="clear-button" on:click={clear}>✖</button>
	{#each messages as msg}
		{msg}
		<br />
	{/each}
</div>

<style>
	.overlay {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 400px;
		max-height: 40vh;
		overflow-y: auto;
		background-color: rgba(0, 0, 0, 0.85);
		color: #0f0;
		font-family: monospace;
		font-size: 12px;
		padding: 8px 24px 8px 8px;
		z-index: 99999;
		border-top-left-radius: 8px;
		white-space: pre-wrap;
	}

	.clear-button {
		position: absolute;
		top: 4px;
		right: 6px;
		background: transparent;
		color: #ccc;
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: bold;
	}
</style>
