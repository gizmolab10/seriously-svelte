<script>
	import Panel from './lib/svelte/graph/Panel.svelte';
	import { g } from './lib/ts/common/Globals';
	import { onMount } from 'svelte';

	onMount(() => {
		(async () => {
			await g.setup();
		})()
	});

</script>

<Panel/>
