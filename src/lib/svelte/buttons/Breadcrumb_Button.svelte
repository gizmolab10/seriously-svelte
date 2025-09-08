<script lang='ts'>
	import { h, k, u, ux, Point, Thing, debug, colors, layout, signals } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_fontFamily, w_ancestry_focus } from '../../ts/managers/Stores';
	import { T_Search, T_Banner, S_Element } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/managers/Stores';
	import { search } from '../../ts/managers/Search';
	import Button from './Button.svelte';
	export let left = 0;
	export let s_breadcrumb;
	export let center = Point.zero;
	const borderStyle = '1px solid';
	let borderColor = $w_background_color;
	let thing = s_breadcrumb.ancestry.thing;
	let title = thing.breadcrumb_title ?? k.empty;
	let colorStyles = s_breadcrumb.background;
	let name = `crumb: ${title ?? 'unknown'}`;
	let ancestry = s_breadcrumb.ancestry;
	let width = u.getWidthOf(title) + 15;
	let border = s_breadcrumb.border;;
	let color = s_breadcrumb.color;
	let reattachments = 0;
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
			colorStyles = s_breadcrumb.background;
			border = s_breadcrumb.border;
			color = s_breadcrumb.color;
			updateStyle();
		}
		reattachments += 1;
	}

	function updateStyle() {
		style=`
			${colorStyles};
			cursor:pointer;
			color:${color};
			white-space:pre;
			border:${border};
			border-radius: 1em;
			padding:1px 6px 1px 6px;
			font: ${k.font_size.common}px ${$w_thing_fontFamily};
		`.removeWhiteSpace();
	}

	function closure(s_mouse) {
		if (!!h && h.hasRoot) {
			if (s_mouse.isHover) {
				if (s_mouse.isOut) {
					border = s_breadcrumb.border;
				} else {
					border = `${borderStyle} ${thing.color}`;
				}
				const cursor = !ancestry.isGrabbed && ancestry.hasChildren ? 'pointer' : k.cursor_default;
				s_breadcrumb.set_forHovering(thing.color, cursor);
				s_breadcrumb.isOut = s_mouse.isOut;
				updateStyle();
				reattachments += 1;
			} else if (s_mouse.isUp) {
				search.deactivate();
				ancestry.grabOnly();
				if (ancestry.becomeFocus()) {
					layout.grand_build();
				}
			}
		}
	}

</script>

{#key reattachments + $w_background_color}
	<Button
		name={name}
		style={style}
		width={width}
		center={center}
		closure={closure}
		position='absolute'
		s_button={s_breadcrumb}>
		{title}
	</Button>
{/key}
