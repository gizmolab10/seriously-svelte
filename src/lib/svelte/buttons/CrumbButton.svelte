<script lang='ts'>
	import { k, s, u, Point, Thing, onMount, signals, dbDispatch, Appearance, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/Stores';
	import Button from '../buttons/Button.svelte';
	export let left = 0;
    export let ancestry;
	export let center = new Point();
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let height = k.default_buttonSize;
	let thing: Thing = ancestry.thing;
	let title: string = thing.title;
	let cursorStyle = k.empty;
	let colorStyles = k.empty;
	let style = k.empty;
	let name = k.empty;
	let rebuilds = 0;
	let width = 0;

	onMount(() => { updateColors(); });

	$: {
		thing = ancestry.thing;
		title = thing.title;
		width = u.getWidthOf(thing.title);
		name = `crumb (for ${title ?? 'unknown'})`
		center = new Point(left + width / 2, height - 1);
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
			cursorStyle = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'cursor: pointer;' : k.empty;
			borderColor = ancestry.isGrabbed ? thing.color : k.color_background;
			border = `${borderStyle} ${borderColor}`;
			updateStyle();
		}
		rebuilds += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			${cursorStyle};
			border:${border};
			border-radius: 1em;
		`.removeWhiteSpace();
	}

	function closure(mouseData) {
		if (dbDispatch.db.hasData) {
			if (mouseData.isHover) {
				const appearance = Appearance.out_withColor(mouseData.isOut, thing.color);
				s.setAppearance_forName(name, appearance);
				if (mouseData.isOut) {
					border = `${borderStyle} ${borderColor}`;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				updateStyle();
				rebuilds += 1;
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
	<Button
		name={name}
		style={style}
		width={width}
		center={center}
		closure={closure}
		position='absolute'>
		<div style='padding:1px 0px 0px 0px; {cursorStyle}'>
			{title.injectElipsisAt()}
		</div>
	</Button>
{/key}
