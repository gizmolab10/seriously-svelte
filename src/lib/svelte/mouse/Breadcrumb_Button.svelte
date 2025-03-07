<script lang='ts'>
	import { k, u, ux, Point, Thing, T_Tool, signals } from '../../ts/common/Global_Imports';
	import { databases, T_Element, S_Element } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_thing_fontFamily } from '../../ts/common/Stores';
	import Button from './Button.svelte';
	import { onMount } from 'svelte';
	export let left = 0;
    export let ancestry;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	const elementType = T_Element.crumb;
	let borderColor = k.color_background;
	let border = `${borderStyle} ${borderColor}`;
	let height = k.default_buttonSize;
	let thing: Thing = ancestry.thing;
	let title: string = thing.title;
	let s_element: S_Element;
	let colorStyles = k.empty;
	let style = k.empty;
	let name = k.empty;
	let rebuilds = 0;
	let width = 0;

	updateColors();

	$: {
		thing = ancestry?.thing;
		title = thing?.breadcrumb_title ?? k.empty;
		name = `crumb (for ${title ?? 'unknown'})`
		width = u.getWidthOf(title) + 15;
		center = new Point(left + width / 2, height - 1);
		s_element = ux.s_element_for(ancestry, elementType, T_Tool.none);
		updateColors();
	}

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			updateColors();
		}
	}

	function updateColors() {
		if (!!thing) {
			if ($w_ancestry_focus.id_thing == thing.id) {
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
			font: ${k.font_size}px ${$w_thing_fontFamily};
		`.removeWhiteSpace();
	}

	function closure(s_mouse) {
		if (!!databases.db_now.hierarchy && databases.db_now.hierarchy.hasRoot) {
			if (s_mouse.isHover) {
				if (s_mouse.isOut) {
					border = `${borderStyle} ${borderColor}`;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				const cursor = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'pointer' : k.cursor_default;
				s_element.set_forHovering(thing.color, cursor);
				s_element.isOut = s_mouse.isOut;
				updateStyle();
				rebuilds += 1;
			} else if (s_mouse.isUp) {
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
		s_element={s_element}>
		{title}
	</Button>
{/key}
