<script lang='ts'>
	import { s_id_popupView } from '../../ts/state/Svelte_Stores';
	import Open from './Open.svelte';
	let selectedFiles: FileList | null = null;

	console.log('load')

	function handleFilesSelected(event: CustomEvent<FileList>) {
		selectedFiles = event.detail;
		console.log('Selected files:', selectedFiles);
		$s_id_popupView = null;
	}

	function handleCancel() {
		selectedFiles = null;
		console.log('File selection was canceled.');
		$s_id_popupView = null;
	}
</script>

<Open
	multiple={false}
	accept='.seriously'
	on:cancel={handleCancel}
	on:filesSelected={handleFilesSelected}
/>
