<script lang='ts'>
	import { w_thing_color, w_background_color, w_thing_fontFamily, w_ancestry_focus } from '../../ts/common/Stores';
	import { h, k, u, ux, Point, Thing, colors, layout, signals } from '../../ts/common/Global_Imports';
	import { T_Banner, S_Element } from '../../ts/common/Global_Imports';
	import Button from './Button.svelte';
	export let left = 0;
	export let es_breadcrumb;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	let borderColor = $w_background_color;
	let thing = es_breadcrumb.ancestry.thing;
	let title = thing.breadcrumb_title ?? k.empty;
	let colorStyles = es_breadcrumb.background;
	let name = `crumb: ${title ?? 'unknown'}`;
	let ancestry = es_breadcrumb.ancestry;
	let width = u.getWidthOf(title) + 15;
	let border = es_breadcrumb.border;;
	let breadcrumb_reattachments = 0;
	let color = es_breadcrumb.color;
	let style = k.empty;

	center = new Point(left + width / 2, 14);
	updateColors();
	$: { const _ = $w_background_color; updateColors(); }

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			updateColors();
		}
	}
	
	function updateColors() {
		if (!!thing) {
			colorStyles = es_breadcrumb.background;
			border = es_breadcrumb.border;
			color = es_breadcrumb.color;
			updateStyle();
		}
		breadcrumb_reattachments += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			cursor:pointer;
			color:${color};
			white-space:pre;
			border:${border};
			border-radius: 1em;
			padding:0px 6px 2px 6px;
			font: ${k.font_size.common}px ${$w_thing_fontFamily};
		`.removeWhiteSpace();
	}

	function closure(s_mouse) {
		if (!!h && h.hasRoot) {
			if (s_mouse.isHover) {
				if (s_mouse.isOut) {
					border = es_breadcrumb.border;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				const cursor = !ancestry.isGrabbed && ancestry.hasChildren ? 'pointer' : k.cursor_default;
				es_breadcrumb.set_forHovering(thing.color, cursor);
				es_breadcrumb.isOut = s_mouse.isOut;
				updateStyle();
				breadcrumb_reattachments += 1;
			} else if (s_mouse.isUp) {
				ancestry.grabOnly();
				if (ancestry.becomeFocus()) {
					layout.grand_build();
				}
			}
		}
	}

</script>

{#key breadcrumb_reattachments + $w_background_color}
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
