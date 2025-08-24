<script lang='ts'>
	import { debug, signals, Ancestry, components, S_Component } from '../../ts/common/Global_Imports';
	import { c, k, u, ux, Thing, Point, Angle, layout } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal } from '../../ts/common/Global_Imports';
	import { G_Widget, S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_background_color } from '../../ts/managers/Stores';
	import { w_s_text_edit, w_ancestry_focus } from '../../ts/managers/Stores';
	import { T_Element, T_Component } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed } from '../../ts/managers/Stores';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Tree_Line from '../graph/Tree_Line.svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
    const drag_points_normal = g_widget.widget_pointsNormal;
	const reveal_points_toChild = g_widget.points_toChild;
	const ancestry = g_widget.ancestry;
	const s_widget = g_widget.s_widget;
	const s_reveal = s_widget.s_reveal;
	const s_title = s_widget.s_title;
	const s_drag = s_widget.s_drag;
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

	s_component = signals.handle_anySignal_atPriority(1, ancestry, T_Component.widget, (t_signal, value): S_Component | null => {
		switch (t_signal) {
		case T_Signal.reattach:
				log_connection_state('Before reattachment');
			final_layout();
				u.onNextTick(() => {			// this is needed to ensure the element is connected
					log_connection_state('After reattachment');
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
		const _ = `${$w_thing_color} ${$w_ancestry_focus.id}`;
		update_style();
	}

	$: {
		const reactives = `${$w_s_text_edit?.t_edit}:::${$w_ancestries_grabbed.map(a => a.title).join(',')}`;
		if (reactives != trigger && !!ancestry && s_widget.state_didChange) {
			g_widget.layout_widget();
			trigger = reactives;
			final_layout();
			log_parent_connection('GRABBED STATE CHANGED');
		}
	}

	$: if (!!s_component?.element) {
		log_parent_connection('BIND TO ELEMENT');
		
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
			border-radius : ${border_radius}px;
		`;
		
		debug.log_style('Setting widget_style for:', ancestry?.title, 'to:', widget_style);
		
		log_connection_state('After setting style');
		setTimeout(() => { log_connection_state('After 2 ticks'); }, 2);
		setTimeout(() => { log_connection_state('After 4 ticks'); }, 4);
		setTimeout(() => { log_connection_state('After 100 ticks'); }, 100);
		requestAnimationFrame(() => { log_connection_state('RAF'); });
	}

	function log_parent_connection(prefix: string) {
		const element = s_component?.element;
		if (!!element) {
			const array = [prefix, ' on ', ancestry?.titles];
			array.push(information_about_element('ELEMENT', element));
			debug.log_style(array);
		}
	}

	function information_about_element(prefix: string, element: HTMLElement | null | undefined): string {
		const indented = k.newLine + k.tab + prefix + k.space;
		const array = !element ? [] : [
			k.newLine + k.tab + k.title.line,
			indented + 'tagName:', element.tagName,
			indented + 'isConnected:', element.isConnected,
			indented + 'getBoundingClientRect:', JSON.stringify(element.getBoundingClientRect()),
			indented + 'ownerDocument.contains:', element.ownerDocument?.contains(element),
			indented + 'getRootNode:', element.getRootNode()?.nodeName,
			indented + 'compareDocumentPosition:', element.compareDocumentPosition(document.body) & 0x8 ? 'body contains ' + prefix : prefix + ' is orphaned'	,
			indented + 'closest body:', element.closest('body')?.tagName];
			return array.join(k.tab);
	}

	function log_style(prefix: string) {
		const element = s_component?.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const computed = window.getComputedStyle(element);
			const array = [prefix, ' on ', ancestry?.title, ':', 	
				indented + 'getAttribute:', element.getAttribute('style'),
				indented + 'cssText:', element.style.cssText,
				indented + 'style.backgroundColor:', element.style.backgroundColor,
				indented + 'computed.backgroundColor:', computed.backgroundColor,
				indented + 'computed.display:', computed.display,
				indented + 'computed.visibility:', computed.visibility,
				indented + 'isConnected:', element.isConnected,
				indented + 'getBoundingClientRect:', JSON.stringify(element.getBoundingClientRect()),
				indented + 'ownerDocument:', element.ownerDocument === document ? 'main document' :'different document',
				indented + (element.offsetParent === element.parentElement) ? 'positioning is normal' :'offset is not parent'
			];
			debug.log_style(array.join(k.tab));
		}
	}

	function log_connection_state(prefix: string) {
		const element = s_component?.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const parent = element.parentElement;
			const element_style = element?.getAttribute('style')?.replace(/; /g, indented);
			const array = [indented + 'connection state for ' + ancestry?.titles + ':',
				indented + k.title.line,
				indented + 's_widget.background:', s_widget.background,
				indented + 'ancestry.isGrabbed:', ancestry?.isGrabbed,
				indented + 'ancestry.isEditing:', ancestry?.isEditing,
				indented + 'ancestry.isFocus:', ancestry?.isFocus,
				indented + 's_widget.isOut:', s_widget.isOut,
				indented + 's_widget.isFilled:', s_widget.isFilled,
				indented + 's_widget.shows_border:', s_widget.shows_border,
				indented + 'previousSibling:', element.previousSibling?.nodeName,
				indented + 'nextSibling:', element.nextSibling?.nodeName,
				indented + k.title.line
			];
			array.push(indented + element_style);
			array.push(information_about_element('ELEMENT', element));
			array.push(information_about_element('PARENT', element.parentElement));
			array.push(information_about_element('GRAND-PARENT', element.parentElement?.parentElement));
			debug.log_style(array.join(k.tab));
		}
	}

	async function handle_click_event(event) {
		event.preventDefault();
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout_maybe() {
		if (s_widget.state_didChange) {
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

	function setup_fromAncestry() {
		s_widget.state_didChange;
		thing = ancestry?.thing;
		if (!ancestry) {
			console.warn('widget is missing an ancestry');
		} else if (!thing) {
			console.warn(`widget is missing a thing for "${ancestry?.id ?? k.unknown}"`);
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
