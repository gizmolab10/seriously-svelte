<script lang='ts'>
	import { k, s, u, Point, Thing, onMount, signals, dbDispatch, ButtonState, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/ReactiveState';
	import Button from './Button.svelte';
	export let left = 0;
    export let ancestry;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let height = k.default_buttonSize;
	let thing: Thing = ancestry.thing;
	let title: string = thing.title;
	let buttonState!: ButtonState;
	let colorStyles = k.empty;
	let style = k.empty;
	let name = k.empty;
	let rebuilds = 0;
	let width = 0;

	onMount(() => { updateColors(); });

	$: {
		thing = ancestry.thing;
		title = thing.title;
		width = thing.titleWidth;
		name = `crumb (for ${title ?? 'unknown'})`
		buttonState = s.buttonState_forName(name);
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
			borderColor = ancestry.isGrabbed ? thing.color : k.color_background;
			border = `${borderStyle} ${borderColor}`;
			updateStyle();
		}
		rebuilds += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			border:${border};
			border-radius: 1em;
			cursor:{buttonState.cursor};
		`.removeWhiteSpace();
	}

	function closure(mouseState) {
		if (dbDispatch.db.hasData) {
			if (mouseState.isHover) {
				if (mouseState.isOut) {
					border = `${borderStyle} ${borderColor}`;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				const cursor = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'pointer' : k.cursor_default;
				buttonState.update(mouseState.isOut, thing.color, cursor);
				updateStyle();
				rebuilds += 1;
			} else if (mouseState.isUp) {
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
		<div style='padding:1px 0px 0px 0px; cursor:{buttonState.cursor};'>
			{title.injectElipsisAt()}
		</div>
	</Button>
{/key}
