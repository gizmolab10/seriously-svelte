<script lang='ts'>
	import { k, get, Thing, Signals, onMount, dbDispatch, desaturateBy, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere } from '../../ts/managers/State';
	export let thing = Thing;
	let colorStyles = '';

	onMount( () => { updateColors(); });

	function updateColors() {
		const isHere = thing.id === get(idHere);
		if (isHere) {
			colorStyles = 'background-color: ' + thing.color + '; color: ' + k.backgroundColor;
		} else {
			colorStyles = 'background-color: ' + k.backgroundColor + '; color: ' + thing.color;
		}
	};

	function handleClick(event) {
		if (dbDispatch.db.hasData) {
			thing.grabOnly();
			thing.becomeHere();
		}
	}

</script>

<button
	on:click={handleClick}
	style='
		border-radius: 0.5em;
		border: 1px solid {thing.color};
		cursor: {thing.hasChildren ? 'pointer' : 'normal'};
		{colorStyles};'>
	{thing.title.injectElipsisAt()}
</button>
