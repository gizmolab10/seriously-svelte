<script>
	import { builds, onMount } from '../../ts/common/GlobalImports';
	import { id_popupView } from '../../ts/managers/State';
	import Directionals from '../kit/Directionals.svelte'
	import CloseButton from '../kit/CloseButton.svelte'
	export let size = 20;
	const indexedNotes = Object.entries(builds.notes).reverse();
	let notesOffset = 0;
	let notes = []
	
	onMount(() => { updateNotes(); })
    function display(goLeft) { return shouldEnable(goLeft) ? 'block' : 'none'; }

	function updateNotes() {
		const end = Math.min(indexedNotes.length, notesOffset + 10);
		notes = indexedNotes.slice(notesOffset, end);
	}
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $id_popupView = null; break;
		}
	}

	function shouldEnable(goLeft) {
		if (goLeft) {
			return notesOffset >= 0;
		} else {
			return (builds.notes.length - notesOffset) > 1;
		}
	}

	function handleHit(goLeft) {
		let offset = notesOffset + (10 * (goLeft ? -1 : 1));
		if (offset < 0 || (builds.notes.length - offset) < 1) {
			return;
		}
		notesOffset = offset;
		updateNotes();
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
<div class='modal-overlay'>
	<div class='modal-content'>
		{#key notes}
			<Directionals hit={handleHit} display={display}/>
		{/key}
		<CloseButton size={size}/>
		<h2>Seriously Build Notes (10 most recent)</h2>
		<table>
			<tr>
				<th>Build</th>
				<th>Date</th>
				<th>Note</th>
			</tr>
			{#each notes as [key, value]}
				<tr>
					<td>{key}</td>
					<td>{value[0]}</td>
					<td>&nbsp; {value[1]}</td>
				</tr>
			{/each}
		</table>
	</div>
</div>

<style>
	.modal-overlay {
		background-color: rgba(0, 0, 0, 0.1);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
	.modal-content {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		background-color: #fff;
		border-radius: 4px;
		position: absolute;
		font-size: 0.8em;
		padding: 20px;
		width: 400px;
	}
</style>
