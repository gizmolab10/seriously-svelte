<script lang='ts'>
	import { k, u, Thing, onMount, signals, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/State';
    export let ancestry;
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let thing: Thing = ancestry.thing;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let rebuilds = 0;

	onMount(() => { updateColors(); });
	function handle_mouse_out(event) { border = `${borderStyle} ${borderColor}`; }
	function handle_mouse_over(event) { border = `${borderStyle} ${thing.color}`; }

	$: {
		thing = ancestry.thing;
		updateColors();
	}

	$: {
		if (ancestry.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateColors();
		}
	}

	function updateColors() {
		if (!!thing) {
			if ($s_ancestry_focus.idThing == thing.id) {
				colorStyles = `background-color: ${transparentize(thing.color, 0.15)}; color: ${k.color_background}`;
			} else {
				colorStyles = `background-color: ${k.color_background}; color: ${thing.color}`;
			}
			cursorStyle = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'cursor: pointer' : k.empty;
			borderColor = ancestry.isGrabbed ? thing.color : k.color_background;
			border = `${borderStyle} ${borderColor}`;
		}
		rebuilds += 1;
	};

	function mouse_click_closure(event) {
		if (dbDispatch.db.hasData) {
			ancestry.grabOnly();
			if (ancestry.becomeFocus()) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

</script>

{#key rebuilds}
	<button
		on:blur={u.ignore}
		on:focus={u.ignore}
		on:mouseout={handle_mouse_out}
		on:mouseover={handle_mouse_over}
		on:click={mouse_click_closure}
		style='
			{colorStyles};
			{cursorStyle};
			border:{border};
			border-radius: 1em;'>
			<div style='padding:0px 0px 1px 0px; {cursorStyle};'>
				{thing?.title.injectElipsisAt()}
			</div>
	</button>
{/key}
