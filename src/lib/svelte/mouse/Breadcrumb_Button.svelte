<script lang='ts'>
	import { k, u, ux, Point, Thing, IDTool, onMount, signals, opacitize } from '../../ts/common/Global_Imports';
	import { dbDispatch, ElementType, Element_State } from '../../ts/common/Global_Imports';
	import { s_color_thing, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import Button from './Button.svelte';
	export let left = 0;
    export let ancestry;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	const elementType = ElementType.crumb;
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let height = k.default_buttonSize;
	let thing: Thing = ancestry.thing;
	let title: string = thing.title;
	let element_state: Element_State;
	let colorStyles = k.empty;
	let style = k.empty;
	let name = k.empty;
	let rebuilds = 0;
	let width = 0;

	updateColors();

	$: {
		thing = ancestry?.thing;
		title = thing?.title.injectEllipsisAt() ?? k.empty;
		name = `crumb (for ${title ?? 'unknown'})`
		width = u.getWidthOf(title) + 15;
		center = new Point(left + width / 2, height - 1);
		element_state = ux.element_state_for(ancestry, elementType, IDTool.none);
		updateColors();
	}

	$: {
		if (!!thing && thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
			updateColors();
		}
	}

	function updateColors() {
		if (!!thing) {
			if ($s_focus_ancestry.idThing == thing.id) {
				colorStyles = `background-color: ${u.opacitize(thing.color, 0.85)}; color: ${k.color_background}`;
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
			cursor:pointer;
			border:${border};
			border-radius: 1em;
			padding:0px 6px 2px 6px;
			font: ${k.thing_fontSize}px ${$s_thing_fontFamily};
		`.removeWhiteSpace();
	}

	function closure(mouse_state) {
		if (dbDispatch.db.hasData) {
			if (mouse_state.isHover) {
				if (mouse_state.isOut) {
					border = `${borderStyle} ${borderColor}`;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				const cursor = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'pointer' : k.cursor_default;
				element_state.set_forHovering(thing.color, cursor);
				element_state.isOut = mouse_state.isOut;
				updateStyle();
				rebuilds += 1;
			} else if (mouse_state.isUp) {
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
		position='absolute'
		element_state={element_state}>
		{title}
	</Button>
{/key}
