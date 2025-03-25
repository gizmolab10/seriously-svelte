<script lang='ts'>
	import { w_color_trigger, w_background_color, w_thing_fontFamily, w_ancestry_focus } from '../../ts/common/Stores';
	import { k, u, ux, Point, Thing, colors, signals, databases } from '../../ts/common/Global_Imports';
	import { T_Tool, T_Element, S_Element } from '../../ts/common/Global_Imports';
	import Button from './Button.svelte';
	import { onMount } from 'svelte';
	export let left = 0;
    export let ancestry;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	let borderColor = $w_background_color;
	let es_breadcrumb = ux.s_element_for(ancestry, T_Element.breadcrumb, T_Tool.none);
	let title = ancestry.thing?.breadcrumb_title ?? k.empty;
	let name = `crumb (for ${title ?? 'unknown'})`
	let border = `${borderStyle} ${borderColor}`;
	let height = k.default_buttonSize;
	let thing: Thing = ancestry.thing;
	let colorStyles = k.empty;
	let style = k.empty;
	let breadcrumb_rebuilds = 0;
	let width = u.getWidthOf(title) + 15;
		
	center = new Point(left + width / 2, height - 1);
	updateColors();

	$: {
		if (!!thing && thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			updateColors();
		}
	}

	$: {
		const _ = $w_background_color;
		updateColors();
	}
	
	function updateColors() {
		if (!!thing) {
			if ($w_ancestry_focus.id_thing == thing.id) {
				colorStyles = `background-color: ${colors.opacitize(thing.color, 0.85)}; color: ${$w_background_color}`;
			} else {
				colorStyles = `background-color: ${$w_background_color}; color: ${thing.color}`;
			}
			borderColor = ancestry.isGrabbed ? thing.color : $w_background_color;
			border = `${borderStyle} ${borderColor}`;
			updateStyle();
		}
		breadcrumb_rebuilds += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			cursor:pointer;
			white-space:pre;
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
				es_breadcrumb.set_forHovering(thing.color, cursor);
				es_breadcrumb.isOut = s_mouse.isOut;
				updateStyle();
				breadcrumb_rebuilds += 1;
			} else if (s_mouse.isUp) {
				ancestry.grabOnly();
				if (ancestry.becomeFocus()) {
					signals.signal_rebuildGraph_fromFocus();
				}
			}
		}
	}

</script>

{#key breadcrumb_rebuilds + $w_background_color}
	<Button
		name={name}
		style={style}
		width={width}
		center={center}
		closure={closure}
		position='absolute'
		es_button={es_breadcrumb}>
		{title}
	</Button>
{/key}
