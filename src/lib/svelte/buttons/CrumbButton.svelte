<script lang='ts'>
	import { k, u, Thing, onMount, signals, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/Stores';
	import Button from '../buttons/Button.svelte';
    export let ancestry;
	export let style = k.empty;
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let thing: Thing = ancestry.thing;
	let title: string = thing.title;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let titleWidth = k.default_buttonSize;
	let name = k.empty;
	let rebuilds = 0;

	onMount(() => { updateColors(); });

	$: {
		thing = ancestry.thing;
		title = thing.title;
		titleWidth = u.getWidthOf(title) ?? k.default_buttonSize;
		name = `crumb (for ${title ?? 'unknown'})`
		updateColors();
	}

	$: {
		if (thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
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
			updateStyle();
		}
		rebuilds += 1;
	}

	function updateStyle() {
		style=`{style}
			${colorStyles};
			${cursorStyle};
			border:${border};
			border-radius: 1em;
			display:inline-block;
		`.removeWhiteSpace();
	}

	function closure(mouseData) {
		if (dbDispatch.db.hasData) {
			if (mouseData.isHover) {
				if (mouseData.isOut) {
					border = `${borderStyle} ${borderColor}`;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
			} else if (mouseData.isUp) {
				ancestry.grabOnly();
				if (ancestry.becomeFocus()) {
					signals.signal_rebuildGraph_fromFocus();
				}
			}
		}
	}

</script>

{#key rebuilds}
	<div class='crumb-button'
		style='
			position: relative;
			width:{titleWidth}px;
			display: inline-block;
			height:{k.default_buttonSize}px;'>
		<Button
			name={name}
			style={style}
			closure={closure}
			width={titleWidth}
			position='absolute'>
			<div style='padding:0px 0px 1px 0px;'>
				{title.injectElipsisAt()}
			</div>
		</Button>
	</div>
{/key}
