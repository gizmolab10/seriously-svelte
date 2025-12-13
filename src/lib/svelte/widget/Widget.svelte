<script lang='ts'>
	import { g, k, s, u, x, debug, colors, signals, elements, components } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Mouse, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Signal, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { Rect, Point } from '../../ts/common/Global_Imports';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
	const { w_thing_color } = colors;
	const s_widget = g_widget.s_widget;
	const s_drag = s_widget.s_drag;
	const s_title = s_widget.s_title;
	const s_reveal = s_widget.s_reveal;
	const ancestry = g_widget.ancestry;
	const { w_items: w_grabbed } = x.si_grabs;
	const reveal_pointsTo_child = g_widget.pointsTo_child;
    const drag_points_right = g_widget.reveal_dot_isAt_right;
	const { w_s_hover, w_s_title_edit, w_ancestry_focus } = s;
	let observer: MutationObserver | null = null;
	let width_ofWidget = g_widget.width_ofWidget;
	let border_radius = k.height.dot / 2;
	let revealCenter = Point.zero;
	let s_component: S_Component;
	let widget_style = k.empty;
	let reveal_id = k.unknown;
	let trigger = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
	let thing;

	debug.log_draw(`WIDGET ${ancestry?.titles}`);
	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	final_layout();
	layout_maybe();

	s_component = signals.handle_anySignal_atPriority(1, ancestry, T_Hit_Target.widget, (t_signal, value): S_Component | null => {
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
		const _ = `${$w_thing_color}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_ancestry_focus.id}`;
		update_style();
	}

	$: {
		const reactives = `${$w_s_title_edit?.t_edit}:::${u.descriptionBy_titles($w_grabbed)}`;
		if (reactives != trigger && !!ancestry && s_widget.update_state_didChange) {
			trigger = reactives;
			g_widget.layout();
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

	async function handle_click_event(event) {
		u.consume_event(event);
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout_maybe() {
		if (s_widget.update_state_didChange) {
			final_layout();
		}
	}

	function final_layout() {
		const hasExtra_onRight = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const origin_ofWidget = g_widget.origin.offsetBy(g_widget.offset_ofWidget);
		width_ofWidget = g_widget.width_ofWidget;
		height = k.height.row - 1.5;
		border_radius = height / 2;
		left = origin_ofWidget.x;
		top = origin_ofWidget.y;
		s_widget.rect = g.scaled_rect_forElement(s_title.html_element);
		update_style();
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (!!ancestry) {
			if (s_mouse.isLong) {
				ancestry?.becomeFocus();
			} else if (s_mouse.isUp) {
				handle_click_event(s_mouse.event);
			}
			update_style();
		}
	}

	function update_style() {
		widget_style = `
			top : ${top}px;
			left : ${left}px;
			position : absolute;
			height : ${height}px;
			${s_widget.background};
			color : ${s_widget.color};
			border : ${s_widget.border};
			z-index : ${T_Layer.widget};
			width : ${width_ofWidget - 5}px;
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
    <Mouse_Responder
		height={height}
		position='absolute'
        on:keyup={u.ignore}
		s_element={s_widget}
        on:keydown={u.ignore}
        name={s_component.id}
        width={width_ofWidget}
        zindex={T_Layer.widget}
        on:click={handle_click_event}
        handle_s_mouse={handle_s_mouse}
        style={widget_style.removeWhiteSpace()}
        origin={g_widget.origin.offsetBy(g_widget.offset_ofWidget)}>
		<div class='widget-components'
			style='
				left : {-3}px;
				height : {height}px;
				position : absolute;
				width : {width_ofWidget}px;
				z-index : {T_Layer.widget};
				top : {s_widget.isRadial_focus ? -0.5 : -2.5}px;'>
			<Widget_Title
				s_title = {s_title}
				fontSize = {k.font_size.common}px/>
			{#if !s_widget.isRadial_focus}
				<Widget_Drag
					s_drag = {s_drag}
					points_right = {drag_points_right}/>
				{#if ancestry?.showsReveal_forPointingToChild(reveal_pointsTo_child)}
					<Widget_Reveal
						s_reveal = {s_reveal}
						pointsTo_child = {reveal_pointsTo_child}/>
				{/if}
			{/if}
		</div>
	</Mouse_Responder>
{/if}
