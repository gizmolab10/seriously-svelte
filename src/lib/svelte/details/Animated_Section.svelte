<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let isVisible = true;

	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 200),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;
			return {
				duration: 300,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});
</script>

{#if isVisible}
	<div class="animated-section" in:receive={{ key: 'animated-section' }} out:send={{ key: 'animated-section' }}>
		<slot />
	</div>
{/if}
<style>
	.animated-section {
		width: 100%;
		-webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
		-moz-box-sizing: border-box; /* Firefox, other Gecko */
		box-sizing: border-box; /* Opera/IE 8+ */
	}
</style> 