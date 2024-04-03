<script lang='ts'>
	import { k, u, Thing, onMount, signals, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_path_here } from '../../ts/common/State';
    export let path;
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let thing: Thing = path.thing;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;

	onMount(() => { updateColors(); });
	function mouseOver(event) { border = `${borderStyle} ${thing.color}`; }
	function mouseOut(event) { border = `${borderStyle} ${borderColor}`; }

	function updateColors() {
		if (thing) {
			if ($s_path_here.idThing == thing.id) {
				colorStyles = `background-color: ${transparentize(thing.color, 0.15)}; color: ${k.color_background}`;
			} else {
				colorStyles = `background-color: ${k.color_background}; color: ${thing.color}`;
			}
			cursorStyle = !path.isGrabbed && path.hasChildren ? 'cursor: pointer' : k.empty;
			borderColor = path.isGrabbed ? thing.color : k.color_background;
			border = `${borderStyle} ${borderColor}`;
		}
	};

	$: {
		thing = path.thing;
		updateColors();
	}

	function crumb_buttonClicked(event) {
		if (dbDispatch.db.hasData) {
			path.grabOnly();
			if (path.becomeHere()) {
				signals.signal_rebuildWidgets_fromHere();
			}
		}
	}

</script>

<button
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:mouseout={mouseOut}
	on:mouseover={mouseOver}
	on:click={crumb_buttonClicked}
	style='
		{colorStyles};
		{cursorStyle};
		border:{border};
		border-radius: 1em;'>
		<div style='padding:0px 0px 1px 0px; {cursorStyle};'>
			{thing?.title.injectElipsisAt()}
		</div>
</button>
