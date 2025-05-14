<script lang='ts'>
	import { k, ux, Point, layout } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_popupView_id } from '../../ts/common/Stores';
	import { files } from '../../ts/managers/Files';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let accept: string = files.format_preference;
	export let multiple = k.empty;		// can be set to 'multiple'
	let file_input: HTMLInputElement;
	
	onMount(() => {
		if (file_input) {
			file_input.click();
		}
	});

	function dismiss_popup() {
		$w_popupView_id = null;
	}

	function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (!!files && files.length > 0) {
			$w_hierarchy.fetch_fromFile(files[0]);
		}
		target.value = k.empty;		// allow re-selection of the same file, MUST do this AFTER fetch
		layout.grand_build();
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

