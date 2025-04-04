<script lang='ts'>
	import { c, k, u, ux, Thing, Point, Angle, debug, signals, Ancestry, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal, T_Element } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_color_trigger, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_background_color } from '../../ts/common/Stores';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let ancestry!: Ancestry;
	const g_widget = ancestry.g_widget;
	const es_widget = g_widget.es_widget;
	const name = es_widget.name;
    const points_right = g_widget.widget_pointsRight;
	const points_toChild = g_widget.points_toChild;
	const s_widget = ux.s_widget_forAncestry(ancestry);
	const es_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
	const es_title = ux.s_element_for(ancestry, T_Element.title, k.empty);
	const es_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	let widgetWrapper!: Svelte_Wrapper;
	let border_radius = k.dot_size / 2;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let widget_rebuilds = 0;
	let dragData = k.empty;
	let padding = k.empty;
	let border = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	setup_fromAncestry();
	debug.log_build(`WIDGET (grabbed: ${ancestry.isGrabbed}) "${ancestry.title}"`);
	layout();
	layout_maybe();

	onMount(() => {
		const handle_anySignal = signals.handle_anySignal_atPriority(2, (t_signal, received_ancestry) => {
			if (!!widget) {
				debug.log_handle(`(ANY as: ${t_signal}) WIDGET "${thing?.title}"`);
				switch (t_signal) {
					case T_Signal.recreate:
						layout_maybe();
						widget_rebuilds += 1;
						break;
					case T_Signal.reposition:
						reposition();
						break;
				}
			}
		});
		return () => {
			handle_anySignal.disconnect();
		};
	});

	$: {
		if (!!thing && $w_color_trigger?.split(k.generic_separator).includes(thing.id)) {
			widget_rebuilds += 1;
		}
	}

	$: {
		if (!!widget) {
			widgetWrapper = new Svelte_Wrapper(widget, handle_mouse_state, ancestry.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = $w_s_title_edit + $w_ancestries_grabbed;
		if (!!ancestry && !!widget && s_widget.update_forStateChange) {
			reposition();
		}
	}
 
	function isHit(): boolean { return false; }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

	function setup_fromAncestry() {
		s_widget.update_forStateChange;
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

	async function handle_click_event(event) {
		event.preventDefault();
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout_maybe() {
		if (!!ancestry && s_widget.update_forStateChange) {
			const showBorder = ancestry.isGrabbed || ($w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false);
			const showBackground = showBorder || ux.inRadialMode;
			background = showBackground ? `background-color: ${$w_background_color}` : k.empty
			layout();
		}
	}

	function reposition() {
		layout();
		widget.style.top = `${top}px`;
		widget.style.left = `${left}px`;
		widget.style.border = es_widget.border;		// avoid rebuilding by injecting style changes
		widget.style.backgroundColor = ancestry.isGrabbed || ux.inRadialMode ? $w_background_color : 'transparent';
		debug.log_reposition(`  reposition (grabbed: ${ancestry.isGrabbed}) (border: ${es_widget.border}) "${ancestry.title}"`);
	}

	function layout() {
		g_widget.layout_widget_andLine();
		const hasExtra_onRight = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const onRight = ux.inRadialMode ? 0 : 21 + (hasExtra_onRight ? 0.5 : 0);
		const origin_ofWidget = g_widget.origin.offsetBy(g_widget.offset_ofWidget);
		const width = g_widget.width_ofWidget;
		const onLeft = points_right ? 1 : 14;
		top = origin_ofWidget.y;
		left = origin_ofWidget.x;
		height = k.row_height - 1.5;
		border_radius = k.row_height / 2;
		padding = `0px ${onRight}px 0px ${onLeft}px`;
	}

</script>

{#key widget_rebuilds}
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
				background-color : {ancestry.isGrabbed || ux.inRadialMode ? $w_background_color : 'transparent'};
			'>
			<Widget_Drag
				name = {es_drag.name}
				ancestry = {ancestry}
				points_right = {points_right}
			/>
			<Widget_Title
				ancestry = {ancestry}
				name = {es_title.name}
				fontSize = {k.font_size}px
				origin = {g_widget.origin_ofTitle}
			/>
			{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
				<Widget_Reveal
					ancestry = {ancestry}
					name = {es_reveal.name}
					points_toChild = {points_toChild}
				/>
			{/if}
		</div>
	{/if}
{/key}
