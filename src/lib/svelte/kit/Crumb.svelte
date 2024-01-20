<script lang='ts'>
	import { k, noop, Thing, onMount, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_path_here } from '../../ts/managers/State';
	export let path = '';
	let thing: Thing = path.thing();
	let colorStyles = '';
	let cursorStyle = '';

	onMount(() => { updateColors(); });

	function updateColors() {
		if (thing) {
			if ($s_path_here?.thingID == thing.id) {
				colorStyles = 'background-color: ' + thing.color + '; color: ' + k.backgroundColor;
			} else {
				colorStyles = 'background-color: ' + k.backgroundColor + '; color: ' + thing.color;
			}
			cursorStyle = thing.hasChildren ? 'cursor: pointer' : '';
		}
	};

	$: {
		thing = path.thing();
		updateColors();
	}

	function crumb_buttonClicked(event) {
		if (dbDispatch.db.hasData) {
			path.grabOnly();
			path.becomeHere();
		}
	}

	// react to path with     $: {}

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
