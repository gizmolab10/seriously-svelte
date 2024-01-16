<script lang='ts'>
	import { k, Thing, onMount, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_path_here } from '../../ts/managers/State';
	export let thing: Thing;
	export let path = '';
	let colorStyles = '';
	let cursorStyle = '';

	onMount(() => { updateColors(); });

	function updateColors() {
		const isHere = path === $s_path_here;
		if (isHere) {
			colorStyles = 'background-color: ' + thing.color + '; color: ' + k.backgroundColor;
		} else {
			colorStyles = 'background-color: ' + k.backgroundColor + '; color: ' + thing.color;
		}
		cursorStyle = (thing.hasChildren && !path.isGrabbed) ? 'cursor: pointer' : '';
	};

	function crumb_buttonClicked(event) {
		if (dbDispatch.db.hasData) {
			path.grabOnly();
			path.becomeHere();
		}
	}

</script>

<button
	on:click={crumb_buttonClicked}
	style='
		border-radius: 0.5em;
		border: 1px solid {thing.color};;
		{colorStyles};
		{cursorStyle};'>
		<div style='padding:0px 0px 1px 0px; {cursorStyle};'>
			{thing.title.injectElipsisAt()}
		</div>
</button>
