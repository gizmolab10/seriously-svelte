<script>
	import { noop, builds } from '../../ts/common/GlobalImports';
	import { popupViewID } from '../../ts/managers/State';
	export let size = 20;
	let notes = Object.entries(builds.notes).reverse().slice(0, 10)
	
	function handleKeyDown(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $popupViewID = null; break;
		}
	}
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="modal-overlay">
	<div class="modal-content">
		<div class="close-button" style='
			width: {size}px;
			height: {size}px;
			font-size: {size - 1}px;;
			line-height: {size}px;'
			on:keypress={noop()}
			on:click={() => { $popupViewID = null; }}>
				×
			</div>
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
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.modal-content {
		background-color: #fff;
		padding: 20px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		position: relative;
		font-size: 0.8em;
	}
	.close-button {
		display: inline-block;
		text-align: center;
		cursor: pointer;
		color: #000;
		position: absolute;
		border: 1px solid black;
		border-radius: 50%;
		top: 10px;
		right: 10px;
	}
</style>
