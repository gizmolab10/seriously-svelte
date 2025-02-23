<script lang='ts'>
	import { g, k, u, ux, Thing, Point, Angle, debug, signals, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Signal, T_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_fontFamily, w_count_relayout } from '../../ts/state/S_Stores';
	import { w_s_title_edit, w_ancestries_grabbed } from '../../ts/state/S_Stores';
	import { G_Widget, S_Element } from '../../ts/common/Global_Imports';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import W_Title_Editor from './W_Title_Editor.svelte';
	import W_Dot_Reveal from './W_Dot_Reveal.svelte';
	import W_Dot_Drag from './W_Dot_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
	export let origin = Point.zero;
	const width = g_widget.widget_width;
	const name = g_widget.es_widget.name;
    const ancestry = g_widget.widget_ancestry;
    const points_right = g_widget.points_right;
	const points_toChild = g_widget.points_toChild;
	const s_widget = ux.s_widget_forAncestry(ancestry);
	const es_widget = ux.s_element_forName(name);	// created by G_Widget
	const es_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
	const es_title = ux.s_element_for(ancestry, T_Element.title, k.empty);
	const es_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	let widgetWrapper!: Svelte_Wrapper;
	let border_radius = k.dot_size / 2;
	let revealCenter = Point.zero;
	let dragCenter = Point.zero;
	let priorOrigin = origin;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let dragData = k.empty;
	let padding = k.empty;
	let border = k.empty;
	let rebuilds = 0;
	let height = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	setup_fromAncestry();
	debug.log_grab(`  WIDGET ${ancestry.isGrabbed} "${es_widget.border}" "${ancestry.title}"`);

	onMount(() => {
		layout_widget();
		debug.log_mount(`WIDGET ${thing?.description} ${ancestry.isGrabbed}`);
		fullUpdate();
		const handleAny = signals.handle_anySignal_atPriority(3, (t_signal, ancestry) => {
			debug.log_signals(`WIDGET ${thing?.description}`);
			switch (t_signal) {
				case T_Signal.relayout:
					if (ancestry.id_thing == thing?.id) {
						layout_widget()
					}
					break;
				default:
					fullUpdate();
					break;
			}
		});
		return () => {
			handleAny.disconnect();
		};
	});

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!widget) {
			widgetWrapper = new Svelte_Wrapper(widget, handle_mouse_state, ancestry.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = $w_count_relayout;
		if (!!widget) {
			// debug.log_layout(`TRIIGGER at (${left.asInt()}, ${top.asInt()}) "${ancestry.title}"`);
			widget.style.left = `${left}px`;
			widget.style.top = `${top}px`;
		}
	}
	
	$: {
		if (priorOrigin != origin) {
			priorOrigin = origin;
			setTimeout(() => {
				layout_widget()
			}, 1);
		}
	}

	$: {
		const _ = $w_s_title_edit + $w_ancestries_grabbed;
		if (!!ancestry && !!widget && s_widget.update_forChange) {
			widget.style.border = es_widget.border;		// avoid rebuilding by injecting style changes
			widget.style.backgroundColor = ancestry.isGrabbed || g.inRadialMode ? k.color_background : 'transparent';
			debug.log_grab(`  CHANGE "${es_widget.border}" "${ancestry.title}"`);
			layout_widget();
		}
	}
 
	function isHit(): boolean { return false; }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

	function setup_fromAncestry() {
		s_widget.update_forChange;
		thing = ancestry?.thing;
		if (!ancestry) {
			console.log('bad ancestry');
		} else if (!thing) {
			console.log(`bad thing for "${ancestry?.id ?? k.unknown}"`);
		} else {
			const title = thing.title ?? thing.id ?? k.unknown;
			widgetName = `widget ${title}`;
			revealName = `reveal ${title}`;
			if (ancestry.isFocus) {
				debug.log_grab(`  FOCUS grabbed: "${ancestry.isGrabbed}"`);
			}
		}
	}

	function showBorder(): boolean {
		return ancestry.isGrabbed || ($w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false);
	}

	function fullUpdate() {
		if (!!ancestry && s_widget.update_forChange) {
			const showBackground = showBorder() || g.inRadialMode;
			background = showBackground ? `background-color: ${k.color_background}` : k.empty
			layout_widget();
		}
	}

	function layout_widget() {
		const showingReveal = ancestry?.showsReveal ?? false;
		const hasExtraForTinyDots = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const delta = showBorder() ? 0 : 1;
		const leftForward = -7;
		const leftBackward = 50 - (width + (showingReveal ? 25.5 : 15.5));
		const dragOffsetX = points_right ? (g.inRadialMode ? 3 : 2) : (width + (showingReveal ? 22.5 : 14)) - 20;
		const dragOffsetY = g.inRadialMode ? 2.8 : 2.7;
		const leftPadding = points_right ? 1 : 14;
		const rightPadding = g.inRadialMode ? 0 : (hasExtraForTinyDots ? 0.5 : 0) + 21;
		dragCenter = Point.square(k.dot_size / 2).offsetByXY(dragOffsetX, dragOffsetY);
		left = origin.x + delta + (points_right ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px ${leftPadding}px`;
		border_radius = k.row_height / 2;
		height = k.row_height - 1.5;
		top = origin.y + delta;
		if (showingReveal) {
			const revealY = k.dot_size * 0.72;
			const revealX = (!points_right ? (g.inRadialMode ? 21 : 9) : width + k.dot_size - (g.inRadialMode ? 30 : 0));
			revealCenter = new Point(revealX, revealY);
		}
		debug.log_layout(`WIDGET (${left.asInt()}, ${top.asInt()}) ${thing?.title ?? k.unknown}`);
	}

</script>

{#key rebuilds}
	{#if es_widget}
		<div class = 'widget'
			id = '{widgetName}'
			bind:this = {widget}
			style = '
				top : {top}px;
				left : {left}px;
				width : {width}px;
				height : {height}px;
				padding : {padding};
				position :  absolute;
				z-index : {T_Layer.widgets};
				border : {es_widget.border};
				border-radius : {border_radius}px;
				background-color : {ancestry.isGrabbed || g.inRadialMode ? k.color_background : 'transparent'};
			'>
			<W_Dot_Drag
				name = {es_drag.name}
				center = {dragCenter}
				ancestry = {ancestry}
				points_right = {points_right}
			/>
			<W_Title_Editor
				ancestry = {ancestry}
				name = {es_title.name}
				fontSize = {k.font_size}px
				points_right = {points_right}
			/>
			{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
				<W_Dot_Reveal
					ancestry = {ancestry}
					name = {es_reveal.name}
					center = {revealCenter}
					points_toChild = {points_toChild}
				/>
			{/if}
		</div>
	{/if}
{/key}
