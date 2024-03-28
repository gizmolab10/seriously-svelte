<script>
	import Panel from './lib/svelte/panel/Panel.svelte';
	import { g } from './lib/ts/common/Globals';
	import { onMount } from 'svelte';

	onMount(() => { g.setup(); });

</script>

<Panel/>
