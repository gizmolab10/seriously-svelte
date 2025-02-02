<script lang='ts'>
	import { w_hierarchy, w_id_popupView } from '../../ts/state/S_Stores';
	import { k, ux, Point } from '../../ts/common/Global_Imports';
	import { files } from '../../ts/managers/Files';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let accept: string = k.empty;
	export let multiple = k.empty;		// can be set to 'multiple'
	let file_input: HTMLInputElement;
	
	onMount(() => {
		if (file_input) {
			file_input.click();
		}
	});

	function dismiss_popup() {
		$w_id_popupView = null;
	}

	function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (!!files && files.length > 0) {
			$w_hierarchy.fetch_fromFile(files[0]);
		}
		target.value = k.empty;		// allow re-selection of the same file, MUST do this AFTER fetch
		dismiss_popup();
	}

</script>

<input
	on:change={handle_selection}
	on:cancel={dismiss_popup}
	bind:this={file_input}
	style='display: none'
	type='file'
	{multiple}
	{accept}
/>

