<script lang='ts'>
	import { c, k, u, ux, Thing, Point, Angle, debug, layout } from '../../ts/common/Global_Imports';
	import { signals, Ancestry, components, S_Component } from '../../ts/common/Global_Imports';
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
    const pointsNormal = g_widget.widget_pointsNormal;
	const points_toChild = g_widget.points_toChild;
	const ancestry = g_widget.ancestry;
	const s_widget = g_widget.s_widget;
	const s_reveal = s_widget.s_reveal;
	const s_title = s_widget.s_title;
	const s_drag = s_widget.s_drag;
	const name = s_widget.name;
	let width_ofWidget = g_widget.width_ofWidget;
	let border_radius = k.height.dot / 2;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let border = s_widget.border;
	let s_component: S_Component;
	let widget_style = k.empty;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let isHovering = false;
	let dragData = k.empty;
	let trigger = k.empty;
	let padding = k.empty;
	let reattachments = 0;
	let height = 0;
	let left = 0;
	let top = 0;
    let element;
	let thing;
	debug.log_draw(`WIDGET ${ancestry?.titles}`);
	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	final_layout();
	layout_maybe();

	let observer: MutationObserver;

	onMount(() => {
		debug.log_draw('Widget onMount for: ', ancestry?.title);
		s_component = signals.handle_anySignal_atPriority(1, ancestry.hid, T_Component.widget, (t_signal, value): S_Component | null => {
			switch (t_signal) {
			case T_Signal.reattach:
				log_connection_state('Before reattachment');
				final_layout();
				reattachments += 1;
				u.onNextTick(() => {			// this is needed to ensure the element is connected
					log_connection_state('After reattachment');
				});
				break;
			case T_Signal.reposition:
				layout_maybe();
				break;
			}
			return null;
		});
		return () => {
			debug.log_style('Widget unmounting for: ', ancestry?.title);
			if (observer) observer.disconnect();
			s_component.disconnect();
		};
	});

	$: {
		const _ = `${$w_thing_color} ${$w_ancestry_focus.id}`;
		update_colors();
	}

	$: {
		const reactives = `${$w_s_text_edit?.t_edit}:::${$w_ancestries_grabbed.map(a => a.title).join(',')}`;
		if (reactives != trigger && !!ancestry && !!element && s_widget.state_didChange) {
			g_widget.layout_widget();
			trigger = reactives;
			update_colors();
			final_layout();
			log_parent_connection('GRABBED STATE CHANGED');
		}
	}

	$: if (!!element) {
		s_component.element = element;

		log_parent_connection('BIND TO ELEMENT');
		
		observer = new MutationObserver((mutations) => {
			debug.log_style('MutationObserver callback fired', mutations.length, 'mutations for: ', ancestry?.title);
			mutations.forEach((mutation) => {
				debug.log_style('Mutation on element: ', (mutation.target as HTMLElement).tagName, '#', (mutation.target as HTMLElement).id);
				if (mutation.type === 'attributes' && mutation.attributeName === 'style' && mutation.target === element) {
					debug.log_style('Style changed on widget div for', ancestry?.title + ': ', element.style.cssText);
				}
			});
		});
		
		observer.observe(element, { 
			attributes: true, 
			attributeFilter: ['style'],
			attributeOldValue: true
		});
		debug.log_style('Observer set up on widget div for: ', ancestry?.title);
	}
 
	function isHit(): boolean {
		return !!element && !!ancestry;
	}

	function handle_mouse_exit(isOut: boolean) {
		s_widget.isOut = isOut;
		update_colors();
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (!!element && !!ancestry) {	
			if (s_mouse.isHover) {
				isHovering = true;
				update_colors();
				return true;
			} else if (s_mouse.isOut) {
				isHovering = false;
				update_colors();
				return true;
			}
		}
		return false;
	}

	function update_colors() {
		debug.log_style('update_colors called for: ', ancestry?.title);
		log_connection_state('Before update');
		
		border = s_widget.border;
		background = s_widget.background;
		widget_style = `
			${background};
			top : ${top}px;
			left : ${left}px;
			border : ${border};
			position : absolute;
			height : ${height}px;
			width : ${width_ofWidget}px;
			z-index : ${T_Layer.widgets};
			border-radius : ${border_radius}px;
		`.removeWhiteSpace();
		
		debug.log_style('Setting widget_style for: ', ancestry?.title, 'to: ', widget_style);
		
		if (element) {
			const connectedElement = element?.id ? document.getElementById(element.id) : element;
			connectedElement.setAttribute('style', widget_style);
		}
		
		log_connection_state('After setting style');
		setTimeout(() => { log_connection_state('After 2 ticks'); }, 2);
		setTimeout(() => { log_connection_state('After 4 ticks'); }, 4);
		setTimeout(() => { log_connection_state('After 100 ticks'); }, 100);
		requestAnimationFrame(() => { log_connection_state('RAF'); });
	}

	function log_parent_connection(prefix: string) {
		if (!!element) {
			const array = [prefix, ' on ', ancestry?.title];
			array.push(information_about_element('ELEMENT', element));
			debug.log_style(array);
		}
	}

	function information_about_element(prefix: string, element: HTMLElement | null | undefined): string {
		const id = element?.id;
		const connectedElement = id ? document.getElementById(id) : null;
		const array = !element ? [] : [
			`\n  ${prefix} isConnected: `, element.isConnected,
			`\n  ${prefix} offsetParent: `, element.offsetParent?.tagName,
			`\n  ${prefix} getBoundingClientRect: `, JSON.stringify(element.getBoundingClientRect()),
			`\n  ${prefix} ownerDocument.contains: `, element.ownerDocument?.contains(element),
			`\n  ${prefix} getRootNode: `, element.getRootNode()?.nodeName,
			`\n  ${prefix} compareDocumentPosition: `, element.compareDocumentPosition(document.body),
			`\n  ${prefix} closest body: `, element.closest('body')?.tagName];
			if (!connectedElement) {
				array.push(`\n  ${prefix} CONNECTED ELEMENT NOT FOUND`);
			} else {
				array.push(
					`\n  ${prefix} CONNECTED ELEMENT isConnected: `, connectedElement.isConnected,
					`\n  ${prefix} CONNECTED ELEMENT offsetParent: `, connectedElement.offsetParent?.tagName,
					`\n  ${prefix} CONNECTED ELEMENT getBoundingClientRect: `, JSON.stringify(connectedElement.getBoundingClientRect()),
					`\n  ${prefix} CONNECTED ELEMENT style: `, connectedElement.getAttribute('style')
				);
			}
			return array.join('');
	}

	function log_style(prefix: string) {
		if (!!element) {
			const computed = window.getComputedStyle(element);
			debug.log_style(prefix, ' on ', ancestry?.title, ': ', 
				'\n  getAttribute: ', element.getAttribute('style'),
				'\n  cssText: ', element.style.cssText,
				'\n  style.backgroundColor: ', element.style.backgroundColor,
				'\n  computed.backgroundColor: ', computed.backgroundColor,
				'\n  computed.display: ', computed.display,
				'\n  computed.visibility: ', computed.visibility,
				'\n  isConnected: ', element.isConnected,
				'\n  parentElement: ', element.parentElement?.tagName,
				'\n  offsetParent: ', element.offsetParent?.tagName,
				'\n  getBoundingClientRect: ', JSON.stringify(element.getBoundingClientRect()),
				'\n  ownerDocument: ', element.ownerDocument === document ? 'main document' : 'different document'
			);
		}
	}

	function log_connection_state(prefix: string) {
		if (!!element) {
			const parent = element.parentElement;
			const array = [prefix, ' connection state for ', ancestry?.title, ': ',
				'\n  style: ', element.getAttribute('style'),
				'\n  s_widget.background: ', s_widget.background,
				'\n  s_widget.background_color: ', s_widget.background_color,
				'\n  ancestry.isGrabbed: ', ancestry?.isGrabbed,
				'\n  ancestry.isEditing: ', ancestry?.isEditing,
				'\n  ancestry.isFocus: ', ancestry?.isFocus,
				'\n  s_widget.isOut: ', s_widget.isOut,
				'\n  s_widget.isFilled: ', s_widget.isFilled,
				'\n  s_widget.shows_border: ', s_widget.shows_border,
				'\n  previousSibling: ', element.previousSibling?.nodeName,
				'\n  nextSibling: ', element.nextSibling?.nodeName
			];
			array.push(information_about_element('ELEMENT', element));
			array.push(information_about_element('PARENT', element.parentElement));
			array.push(information_about_element('GRAND-PARENT', element.parentElement?.parentElement));
			array.push(information_about_element('GREAT-GRAND-PARENT', element.parentElement?.parentElement?.parentElement));
			array.push(information_about_element('GREAT-GREAT-GRAND-PARENT', element.parentElement?.parentElement?.parentElement?.parentElement));
			array.push(information_about_element('GREAT-GREAT-GREAT-GRAND-PARENT', element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement));
			debug.log_style(array.join(''));
		}
	}

	async function handle_click_event(event) {
		event.preventDefault();
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout_maybe() {
		if (s_widget.state_didChange) {
			update_colors();
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
			widgetName = `widget ${title}`;
			revealName = `reveal ${title}`;
		}
	}
    
</script>

{#if s_widget}
    <div class = 'widget'
        id = '{widgetName}'
        on:keyup = {u.ignore}
        bind:this = {element}
        style = {widget_style}
        on:keydown = {u.ignore}
        on:click = {handle_click_event}>
        <Widget_Drag
            s_drag = {s_drag}
            pointsNormal = {pointsNormal}/>
        <Widget_Title
            s_title = {s_title}
            fontSize = {k.font_size.common}px/>
        {#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
            <Widget_Reveal
                s_reveal = {s_reveal}
                points_toChild = {points_toChild}/>
        {/if}
    </div>
{/if}
