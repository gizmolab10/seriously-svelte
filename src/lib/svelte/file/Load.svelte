<script lang='ts'>
	import { s_id_popupView } from '../../ts/state/Svelte_Stores';
	import { files } from '../../ts/managers/Files';
	import Open from './Open.svelte';

	function handle_cancel() {
		console.log('File selection was canceled.');
		$s_id_popupView = null;
	}

	function handle_files_selected(event: CustomEvent<FileList>) {
		const json = files.extract_json_object_from(event.detail[0]);
		console.log('Extracted:', json);
		$s_id_popupView = null;
	}

</script>

<Open
	accept='.json'
	on:cancel={handle_cancel}
	on:files_selected={handle_files_selected}
/>
