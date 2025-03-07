<script lang='ts'>
	import { g, k, u, ux, Thing, Point, Angle, debug, signals, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal, T_Element } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestries_grabbed } from '../../ts/managers/Stores';
	import { w_thing_color, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import W_Title_Editor from './W_Title_Editor.svelte';
	import W_Dot_Reveal from './W_Dot_Reveal.svelte';
	import W_Dot_Drag from './W_Dot_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
	export let t_widget!: T_Widget;
	const name = g_widget.es_widget.name;
    const ancestry = g_widget.ancestry_ofWidget;
    const points_right = g_widget.points_right;
	const points_toChild = g_widget.points_toChild;
	const s_widget = ux.s_widget_forAncestry(ancestry);
	const es_widget = ux.s_element_forName(name);	// created by G_Widget
	const es_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
	const es_title = ux.s_element_for(ancestry, T_Element.title, k.empty);
	const es_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	let widgetWrapper!: Svelte_Wrapper;
	let border_radius = k.dot_size / 2;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let priorOrigin = Point.zero;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let origin = Point.zero;
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
	debug.log_mount(`WIDGET (grabbed: ${ancestry.isGrabbed}) "${ancestry.title}"`);

	onMount(() => {
		layout();
		fullUpdate();
		const handle_anySignal = signals.handle_anySignal_atPriority(2, (t_signal, received_ancestry) => {
			if (!!widget) {
				debug.log_handle(`(ANY as: ${t_signal}) WIDGET "${thing?.title}"`);
				switch (t_signal) {
					case T_Signal.recreate:
						fullUpdate();
						break;
					case T_Signal.relayout:
						layout();
						debug.log_layout(`TRIGGER [. . .] widget on "${ancestry.title}"`);
						widget.style.width = `${g_widget.width_ofWidget}px`;
						widget.style.left = `${left}px`;
						widget.style.top = `${top}px`;
						break;
				}
			}
		});
		return () => {
			handle_anySignal.disconnect();
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
		if (priorOrigin != origin) {
			priorOrigin = origin;
			setTimeout(() => {
				layout()
			}, 1);
		}
	}

	$: {
		const _ = $w_s_title_edit + $w_ancestries_grabbed;
		if (!!ancestry && !!widget && s_widget.update_forChange) {
			widget.style.border = es_widget.border;		// avoid rebuilding by injecting style changes
			widget.style.backgroundColor = ancestry.isGrabbed || g.inRadialMode ? k.color_background : 'transparent';
			debug.log_grab(`  CHANGE (grabbed: ${ancestry.isGrabbed}) (border: ${es_widget.border}) "${ancestry.title}"`);
			layout();
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
				debug.log_grab(`  FOCUS (grabbed: ${ancestry.isGrabbed}) "${ancestry.title}"`);
			}
		}
	}

	function update_origin() {
		switch (t_widget) {
			case T_Widget.radial: origin = g_widget.origin_ofRadial; break;
			case T_Widget.focus:  origin = g_widget.origin_ofFocus; break;
			case T_Widget.tree:   origin = g_widget.origin_ofChildrenTree; break;
		}
	}

	function showBorder(): boolean {
		return ancestry.isGrabbed || ($w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false);
	}

	function fullUpdate() {
		if (!!ancestry && s_widget.update_forChange) {
			const showBackground = showBorder() || g.inRadialMode;
			background = showBackground ? `background-color: ${k.color_background}` : k.empty
			layout();
		}
	}

	async function handle_click_event(event) {
		event.preventDefault();
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout() {
		g_widget.layout();
		update_origin();
		const hasExtra_onRight = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const onRight = g.inRadialMode ? 0 : 21 + (hasExtra_onRight ? 0.5 : 0);
		const origin_ofWidget = origin.offsetBy(g_widget.offset_ofWidget);
		const width = g_widget.width_ofWidget;
		const onLeft = points_right ? 1 : 14;
		top = origin_ofWidget.y;
		left = origin_ofWidget.x;
		height = k.row_height - 1.5;
		border_radius = k.row_height / 2;
		padding = `0px ${onRight}px 0px ${onLeft}px`;
		debug.log_layout(`WIDGET o: (${left.asInt()}, ${top.asInt()}) w: ${width.asInt()} ${thing?.title ?? k.unknown}`);
	}

</script>

{#key rebuilds}
	{#if es_widget}
		<div class = 'widget'
			id = '{widgetName}'
			bind:this = {widget}
			on:click={handle_click_event}
			style = '
				top : {top}px;
				left : {left}px;
				height : {height}px;
				padding : {padding};
				position :  absolute;
				z-index : {T_Layer.widgets};
				border : {es_widget.border};
				border-radius : {border_radius}px;
				width : {g_widget.width_ofWidget}px;
				background-color : {ancestry.isGrabbed || g.inRadialMode ? k.color_background : 'transparent'};
			'>
			<W_Dot_Drag
				name = {es_drag.name}
				ancestry = {ancestry}
				points_right = {points_right}
				center = {g_widget.center_ofDrag}
			/>
			<W_Title_Editor
				ancestry = {ancestry}
				name = {es_title.name}
				fontSize = {k.font_size}px
				points_right = {points_right}
				origin = {g_widget.origin_ofTitle}
			/>
			{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
				<W_Dot_Reveal
					ancestry = {ancestry}
					name = {es_reveal.name}
					points_toChild = {points_toChild}
					center = {g_widget.center_ofReveal}
				/>
			{/if}
		</div>
	{/if}
{/key}
