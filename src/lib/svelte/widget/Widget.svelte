<script lang='ts'>
	import { debug, signals, Ancestry, components, S_Component } from '../../ts/common/Global_Imports';
	import { c, k, u, ux, x, grabs, Thing, Point, Angle, layout } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestry_focus } from '../../ts/managers/Stores';
	import { T_Element, T_Component } from '../../ts/common/Global_Imports';
	import { w_thing_color } from '../../ts/managers/Stores';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Tree_Line from '../graph/Tree_Line.svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
	const s_widget = g_widget.s_widget;
	const s_drag = s_widget.s_drag;
	const s_title = s_widget.s_title;
	const s_reveal = s_widget.s_reveal;
	const ancestry = g_widget.ancestry;
	const { w_items: w_grabbed } = x.si_grabs;
	const reveal_points_toChild = g_widget.points_toChild;
    const drag_points_normal = g_widget.widget_pointsNormal;
	let observer: MutationObserver | null = null;
	let width_ofWidget = g_widget.width_ofWidget;
	let border_radius = k.height.dot / 2;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let s_component: S_Component;
	let widget_style = k.empty;
	let reveal_id = k.unknown;
	let isHovering = false;
	let trigger = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
	let thing;

	debug.log_draw(`WIDGET ${ancestry?.titles}`);
	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	final_layout();
	layout_maybe();
	if (top < 1) {
		debug.log_layout(`ONMOUNT ${top.toFixed(0)} ${left.toFixed(0)} ${ancestry.titles}`);
	}

	s_component = signals.handle_anySignal_atPriority(1, ancestry, T_Component.widget, (t_signal, value): S_Component | null => {
		switch (t_signal) {
		case T_Signal.reattach:
				s_component?.debug_log_connection_state('Before reattachment');
				final_layout();
				u.onNextTick(() => {			// this is needed to ensure the element is connected
					s_component?.debug_log_connection_state('After reattachment');
				});
			break;
		case T_Signal.reposition:
			layout_maybe();
			break;
		}
	});

	onMount(() => {
		return () => {
			debug.log_style('Widget unmounting for:', ancestry?.title);
			if (observer) observer.disconnect();
			s_component.disconnect();
		};
	});

	$: {
		const _ = `${$w_thing_color}:::${$w_ancestry_focus.id}`;
		update_style();
	}

	$: {
		const reactives = `${$w_s_title_edit?.t_edit}:::${u.description_byTitles($w_grabbed)}`;
		if (reactives != trigger && !!ancestry && s_widget.update_state_didChange) {
			trigger = reactives;
			g_widget.layout_widget();
			final_layout();
			s_component.debug_log_connection_state('GRABBED STATE CHANGED');
		}
	}

	$: if (!!s_component && !!s_component.element && s_component.isComponentLog_enabled && false) {
		observer = new MutationObserver((mutations) => {
			debug.log_style('MutationObserver callback fired', mutations.length, 'mutations for:', ancestry?.title);
			mutations.forEach((mutation) => {
				const element = s_component?.element;
				debug.log_style('Mutation on element:', (mutation.target as HTMLElement).tagName, '#', (mutation.target as HTMLElement).id);
				if (mutation.type === 'attributes' && mutation.attributeName === 'style' && mutation.target === element) {
					debug.log_style('Style changed on widget div for', ancestry?.title + ':', element.style.cssText);
				}
			});
		});
		
		observer.observe(s_component?.element, { 
			attributes: true, 
			attributeFilter: ['style'],
			attributeOldValue: true
		});
		debug.log_style('Observer set up on widget div for:', ancestry?.title);
	}

	function handle_mouse_exit(isOut: boolean) {
		s_widget.isOut = isOut;
		update_style();
	}

	async function handle_click_event(event) {
		u.grab_event(event);
		ancestry?.grab_forShift(event.shiftKey);
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (!!ancestry) {	
			if (s_mouse.isHover) {
				isHovering = true;
				update_style();
				return true;
			} else if (s_mouse.isOut) {
				isHovering = false;
				update_style();
				return true;
			}
		}
		return false;
	}

	function layout_maybe() {
		if (s_widget.update_state_didChange) {
			final_layout();
		}
	}

	function final_layout() {
		const hasExtra_onRight = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const origin_ofWidget = g_widget.origin.offsetBy(g_widget.offset_ofWidget);
		top = origin_ofWidget.y;
		left = origin_ofWidget.x;
		height = k.height.row - 1.5;
		border_radius = k.height.row / 2;
		width_ofWidget = g_widget.width_ofWidget;
		update_style();
	}

	function update_style() {
		widget_style = `
			top : ${top}px;
			left : ${left}px;
			position : absolute;
			height : ${height}px;
			${s_widget.background};
			border : ${s_widget.border};
			width : ${width_ofWidget}px;
			z-index : ${T_Layer.widgets};
			border-radius : ${border_radius}px;`;
	}

	function setup_fromAncestry() {
		s_widget.update_state_didChange;
		thing = ancestry?.thing;
		if (!ancestry) {
			console.warn('widget has no ancestry');
		} else if (!thing) {
			console.warn(`relationship (of ancestry of widget) has no child [${ancestry?.relationship?.id ?? k.unknown}]`);
		} else {
			const title = thing.title ?? thing.id ?? k.unknown;
			reveal_id = `reveal ${title} ${ancestry.id}`;
		}
	}
    
</script>

{#if s_widget}
    <div class = 'widget'
		id = {s_component.id}
		on:keyup = {u.ignore}
        on:keydown = {u.ignore}
        on:click = {handle_click_event}
        style = {widget_style.removeWhiteSpace()}>
        <Widget_Drag
            s_drag = {s_drag}
            pointsNormal = {drag_points_normal}/>
        <Widget_Title
            s_title = {s_title}
            fontSize = {k.font_size.common}px/>
        {#if ancestry?.showsReveal_forPointingToChild(reveal_points_toChild)}
            <Widget_Reveal
                s_reveal = {s_reveal}
                points_toChild = {reveal_points_toChild}/>
        {/if}
    </div>
{/if}
