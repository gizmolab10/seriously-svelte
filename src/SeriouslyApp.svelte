<script lang='ts'>
	import { g } from './lib/ts/common/Global_Imports';
	import Panel from './lib/svelte/panel/Panel.svelte';

	setTimeout(() => {
		g.setup();
	}, 1);
</script>

<Panel/>
