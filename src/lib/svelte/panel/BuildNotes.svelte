<script>
	import { k, builds, onMount, ZIndex } from '../../ts/common/GlobalImports';
	import DirectionalButtons from '../mouse buttons/DirectionalButtons.svelte'
	import { s_id_popupView } from '../../ts/state/ReactiveState';
	import CloseButton from '../mouse buttons/CloseButton.svelte';
	const notesIndexed = Object.entries(builds.notes).reverse();
	const notesLimit = notesIndexed.length - 1;
	let title = k.empty;
	let notesIndex = 0;
	let notes = [];
	
	onMount(() => { updateNotes(); })
    function display(pointsUp) { return shouldEnable(pointsUp) ? 'block' : 'none'; }

	function updateNotes() {
		const end = Math.min(notesLimit, notesIndex + 10);
		notes = notesIndexed.slice(notesIndex, end);
		const suffix = notesIndex < 10 ? ' (10 most recent)' : k.empty;
		title = `Seriously Build Notes${suffix}`;
	}
	
	function handle_key_down(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $s_id_popupView = null; break;
		}
	}

	function shouldEnable(pointsUp) {
		if (pointsUp) {
			return notesIndex >= 0;
		} else {
			return (notesLimit - notesIndex) > 0;
		}
	}

	function directional_hit_handler(pointsUp, isLong) {
		if (isLong) {
			notesIndex = pointsUp ? 0 : notesLimit - 10;
		} else {			
			let nextIndex = notesIndex + (10 * (pointsUp ? -1 : 1));
			if (nextIndex < 0 || (notesLimit - nextIndex) < 1) {
				return;
			}
			notesIndex = nextIndex;
		}
		updateNotes();
	}

</script>

<style>
	.notes-modal-overlay {
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
	.notes-modal-content {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		background-color: #fff;
		border-radius: 4px;
		position: relative;
		font-size: 0.8em;
		padding: 20px;
		width: 500px;
	}
	.top-bar {
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

<svelte:document on:keydown={handle_key_down} />
<div class='notes-modal-overlay'>
	<div class='notes-modal-content'>
		<div class='top-bar'>
			{#key notes}
				<DirectionalButtons hit={directional_hit_handler} display={display}/>
			{/key}
			<div class='title'>{title}</div>
			<CloseButton name='builds close' size={k.dot_size * 1.5}/>
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
