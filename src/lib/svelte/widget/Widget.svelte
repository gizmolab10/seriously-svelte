<script lang='ts'>
	import { c, k, u, ux, Thing, Point, Angle, debug, layout } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal, T_Element } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { G_Widget, S_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { signals, Ancestry, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_background_color } from '../../ts/common/Stores';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Tree_Line from '../graph/Tree_Line.svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let g_widget!: G_Widget;
	const ancestry = g_widget.ancestry;
	const s_widget = g_widget.s_widget;
	const name = s_widget.name;
	const es_drag = s_widget.es_drag;
	const es_title = s_widget.es_title;
	const es_reveal = s_widget.es_reveal;
	const points_toChild = g_widget.points_toChild;
    const pointsNormal = g_widget.widget_pointsNormal;
	let width_ofWidget = g_widget.width_ofWidget;
	let border_radius = k.height.dot / 2;
	let widgetWrapper!: Svelte_Wrapper;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let border = s_widget.border;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let isHovering = false;
	let dragData = k.empty;
	let padding = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	final_layout();
	layout_maybe();

	onMount(() => {
		const handle_anySignal = signals.handle_anySignal_atPriority(1, (t_signal, received_ancestry) => {
			if (!!widget) {
				debug.log_handle(`(ANY as: ${t_signal}) WIDGET "${thing?.title}"`);
				switch (t_signal) {
					case T_Signal.reattach:
						layout_maybe();
						break;
					case T_Signal.reposition:
						final_layout();
						break;
				}
			}
		});
		return () => {
			handle_anySignal.disconnect();
		};
	});

	$: {
		if (!!widget) {
			widgetWrapper = new Svelte_Wrapper(widget, handle_s_mouse, ancestry.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = `${$w_thing_color} ${$w_ancestry_focus.id}`;
		update_colors();
	}

	$: {
		const _ = $w_s_text_edit + $w_ancestries_grabbed.join(',');
		if (!!ancestry && !!widget && s_widget.state_didChange) {
			g_widget.layout_widget();
			update_colors();
			final_layout();
		}
	}
 
	function isHit(): boolean { return false; }
	function handle_s_mouse(s_mouse: S_Mouse): boolean { return false; }

	function handle_mouse_exit(isOut: boolean) {
		s_widget.isOut = isOut;
		update_colors();
	}

	function update_colors() {
		background = s_widget.background;
		border = s_widget.border;
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
			console.log('widget is missing an ancestry');
		} else if (!thing) {
			console.log(`widget is missing a thing for "${ancestry?.id ?? k.unknown}"`);
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
		bind:this = {widget}
		on:keydown = {u.ignore}
		on:click = {handle_click_event}
        on:mouseleave={() => handle_mouse_exit(true)}
        on:mouseenter={() => handle_mouse_exit(false)}
		style = '
			{background};
			top : {top}px;
			left : {left}px;
			border : {border};
			height : {height}px;
			position :  absolute;
			width : {width_ofWidget}px;
			z-index : {T_Layer.widgets};
			border-radius : {border_radius}px;;
		'>
		<Widget_Drag
			es_drag = {es_drag}
			pointsNormal = {pointsNormal}/>
		<Widget_Title
			es_title = {es_title}
			fontSize = {k.font_size.common}px/>
		{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
			<Widget_Reveal
				es_reveal = {es_reveal}
				points_toChild = {points_toChild}/>
		{/if}
	</div>
{/if}
