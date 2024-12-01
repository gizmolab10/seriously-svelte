<script lang='ts'>
	import { k, ux, Point } from '../../ts/common/Global_Imports';
	import { onMount, createEventDispatcher } from 'svelte';
	export let accept: string = k.empty;
	export let multiple = k.empty;		// can be set to 'multiple'
	const dispatch = createEventDispatcher();
	let file_input: HTMLInputElement;

	onMount(() => { open_fileDialog(); });
	function dispatch_cancel() { dispatch('cancel'); }
	
	function open_fileDialog() {
		if (file_input) {
			file_input.click();
		}
	}

	function handle_selection(event: Event) {
		const target = (event.target as HTMLInputElement);
		const files = target?.files;
		if (files && files.length > 0) {
			dispatch('files_selected', files);
		} else {
			dispatch_cancel();
		}
		target.value = k.empty;		// allow re-selection of the same file
	}
</script>

<input
	on:change={handle_selection}
	on:cancel={dispatch_cancel}
	bind:this={file_input}
	style='display: none'
	type='file'
	{multiple}
	{accept}
/>
