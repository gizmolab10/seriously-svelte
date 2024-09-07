<script lang='ts'>
	import { e, g } from './lib/ts/common/Global_Imports';
	import Panel from './lib/svelte/panel/Panel.svelte';

	setTimeout(() => {
		g.setup();
		e.setup();
	}, 1);
</script>

<Panel/>
