<script>
	import { builds, onMount, ZIndex } from '../../ts/common/GlobalImports';
	import { id_popupView } from '../../ts/managers/State';
	import Directionals from '../kit/Directionals.svelte'
	import CloseButton from '../kit/CloseButton.svelte'
	export let size = 20;
	const indexedNotes = Object.entries(builds.notes).reverse();
	let notesIndex = 0;
	let notes = []
	
	onMount(() => { updateNotes(); })
    function display(goLeft) { return shouldEnable(goLeft) ? 'block' : 'none'; }

	function updateNotes() {
		const end = Math.min(indexedNotes.length, notesIndex + 10);
		notes = indexedNotes.slice(notesIndex, end);
	}
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $id_popupView = null; break;
		}
	}

	function shouldEnable(goLeft) {
		if (goLeft) {
			return notesIndex >= 0;
		} else {
			return (builds.notes.length - notesIndex) > 0;
		}
	}

	function directional_buttonClicked(goLeft) {
		let nextIndex = notesIndex + (10 * (goLeft ? -1 : 1));
		if (nextIndex < 0 || (builds.notes.length - nextIndex) < 1) {
			return;
		}
		notesIndex = nextIndex;
		updateNotes();
	}

</script>

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
		position: relative;
		font-size: 0.8em;
		padding: 20px;
		width: 500px;
	}
	.header-line {
		justify-content: center;
        align-items: center;
        display: flex;
        gap: 10px;
    }
	.horizontal-line {
		background-color: lightgray;
		position: fixed;
		height: 1px;
		width: 500px;
	}
	.title {
		font-size: 1.5em;
	}
</style>

<svelte:document on:keydown={handleKeyDown} />
<div class='modal-overlay'>
	<div class='modal-content'>
		<div class='header-line'>
			{#key notes}
				<Directionals hit={directional_buttonClicked} display={display}/>
			{/key}
			<div class='title'>Seriously Build Notes (10 most recent)</div>
			<CloseButton size={size}/>
		</div>
		<br>
		<table>
			<tr>
				<th>Build</th>
				<th>Date</th>
				<th>Note</th>
			</tr>
			<div class='horizontal-line' style='z-index: {ZIndex.frontmost};'></div>
			{#key notes}
				{#each notes as [key, value]}
					<tr>
						<td>{key}</td>
						<td>{value[0]}</td>
						<td>&nbsp; {value[1]}</td>
					</tr>
				{/each}
			{/key}
		</table>
	</div>
</div>
