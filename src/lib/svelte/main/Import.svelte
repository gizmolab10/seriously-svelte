<script lang='ts'>
	import { h, k, ux, x, Point, layout } from '../../ts/common/Global_Imports';
	import { T_Storage_Need } from '../../ts/common/Enumerations';
	import { w_popupView_id } from '../../ts/managers/Stores';
	import { files } from '../../ts/files/Files';
	import { s_banners } from '../../ts/state/S_Banners';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let accept: string = '.' + files.format_preference;
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

	async function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (!!files && files.length > 0) {
			await h.fetch_andBuild_fromFile(files[0]);
		}
		target.value = k.empty;		// allow re-selection of the same file, MUST do this AFTER fetch
		s_banners.t_storage_need = T_Storage_Need.direction;
		dismiss_popup();
		layout.grand_build();
	}

</script>

<input
	on:change={handle_selection}
	on:cancel={dismiss_popup}
	bind:this={file_input}
	style='display: none'
	id='import-file'
	type='file'
	{multiple}
	{accept}
/>

