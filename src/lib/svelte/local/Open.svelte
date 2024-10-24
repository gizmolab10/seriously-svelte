<script lang='ts'>
	import { k, ux, Point, onMount } from '../../ts/common/Global_Imports';
	import { createEventDispatcher } from 'svelte';
	export let multiple: boolean = false;
	export let accept: string = k.empty;
	const dispatch = createEventDispatcher();
	let fileInput: HTMLInputElement;

	onMount(() => {
		openFileDialog();
	});
	
	function openFileDialog() {
		if (fileInput) {
			fileInput.click();
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			dispatch('filesSelected', target.files);
		} else {
			dispatch('cancel');
		}
		target.value = k.empty;		// allow re-selection of the same file
	}
</script>

<style>
  /* Hide the file input */
  .file-input {
    display: none;
  }
</style>

<input
	on:change={handleFileChange}
	bind:this={fileInput}
	class='file-input'
	type='file'
	{multiple}
	{accept}
/>
