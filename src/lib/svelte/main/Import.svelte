<script lang='ts'>
	import { w_hierarchy, w_id_popupView } from '../ts/common/Stores';
	import { k, ux, Point } from '../ts/common/Global_Imports';
	import { files } from '../ts/managers/Files';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	interface Props {
		accept?: string;
		multiple?: any; // can be set to 'multiple'
	}

	let { accept = k.empty, multiple = k.empty }: Props = $props();
	let file_input: HTMLInputElement = $state();
	
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
	onchange={handle_selection}
	oncancel={dismiss_popup}
	bind:this={file_input}
	style='display: none'
	type='file'
	{multiple}
	{accept}
/>

