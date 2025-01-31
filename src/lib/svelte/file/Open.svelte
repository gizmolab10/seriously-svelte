<script lang='ts'>
	import { s_hierarchy, s_id_popupView } from '../../ts/state/S_Stores';
	import { k, ux, Point } from '../../ts/common/Global_Imports';
	import { files } from '../../ts/managers/Files';
	import { get } from 'svelte/store';
	import Open from './Open.svelte';
	import { onMount } from 'svelte';
	export let accept: string = k.empty;
	export let multiple = k.empty;		// can be set to 'multiple'
	let file_input: HTMLInputElement;

	onMount(() => { open_fileDialog(); });
	function dismiss_popup() { $s_id_popupView = null; }
	
	function open_fileDialog() {
		if (file_input) {
			file_input.click();
		}
	}

	function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (files && files.length > 0) {
			$s_hierarchy.fetch_fromFile(files[0]);
		}
		dismiss_popup();
		target.value = k.empty;		// allow re-selection of the same file
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

