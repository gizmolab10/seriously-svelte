<script lang='ts'>
	import { c, k, u, ux, Thing, Point, Angle, debug, layout } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Widget, T_Signal, T_Element } from '../../ts/common/Global_Imports';
	import { w_show_related, w_thing_color, w_background_color } from '../../ts/common/Stores';
	import { G_Widget, S_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { signals, Ancestry, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import Widget_Reveal from './Widget_Reveal.svelte';
	import Tree_Line from '../graph/Tree_Line.svelte';
	import Widget_Title from './Widget_Title.svelte';
	import Widget_Drag from './Widget_Drag.svelte';
	import { onMount } from 'svelte';
	export let ancestry!: Ancestry;
	const g_widget = ancestry.g_widget;
	const es_widget = g_widget.es_widget;
	const name = g_widget.es_widget.name;
	const points_toChild = g_widget.points_toChild;
    const points_right = g_widget.widget_pointsRight;
	const s_widget = ux.s_widget_forAncestry(ancestry);
	const es_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
	const es_title = ux.s_element_for(ancestry, T_Element.title, k.empty);
	const es_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	let origin_ofTitle = g_widget.origin_ofTitle;
	let width_ofWidget = g_widget.width_ofWidget;
	let widgetWrapper!: Svelte_Wrapper;
	let border_radius = k.height.dot / 2;
	let center_ofDrag = Point.zero;
	let revealCenter = Point.zero;
	let border = es_widget.border;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let dragData = k.empty;
	let padding = k.empty;
	let height = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	setup_fromAncestry();		// this fails if ancestry's thing id is invalid
	debug.log_build(`WIDGET (grabbed: ${ancestry.isGrabbed}) "${ancestry.title}"`);
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

	$: $w_thing_color, $w_ancestries_grabbed, border = es_widget.border;

	$: {
		if (!!widget) {
			widgetWrapper = new Svelte_Wrapper(widget, handle_s_mouse, ancestry.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = $w_s_title_edit + $w_ancestries_grabbed;
		if (!!ancestry && !!widget && s_widget.update_forStateChange) {
			border = es_widget.border;
			g_widget.layout_widget();
			final_layout();
		}
	}
 
	function isHit(): boolean { return false; }
	function handle_s_mouse(s_mouse: S_Mouse): boolean { return false; }

	function setup_fromAncestry() {
		s_widget.update_forStateChange;
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

	async function handle_click_event(event) {
		event.preventDefault();
		ancestry?.grab_forShift(event.shiftKey);
	}

	function layout_maybe() {
		if (!!ancestry && s_widget.update_forStateChange) {
			const showBorder = ancestry.isGrabbed || ($w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false);
			const showBackground = showBorder || layout.inRadialMode;
			background = showBackground ? `background-color: ${$w_background_color}` : k.empty
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
		origin_ofTitle = g_widget.origin_ofTitle;
	}

</script>

{#if es_widget}
	<div class = 'widget'
		id = '{widgetName}'
		on:keyup={u.ignore}
		bind:this = {widget}
		on:keydown={u.ignore}
		on:click={handle_click_event}
		style = '
			top : {top}px;
			left : {left}px;
			border : {border};
			height : {height}px;
			position :  absolute;
			width : {width_ofWidget}px;
			z-index : {T_Layer.widgets};
			border-radius : {border_radius}px;
			background-color : {ancestry.isGrabbed || layout.inRadialMode ? $w_background_color : 'transparent'};
		'>
		<Widget_Drag
			name = {es_drag.name}
			ancestry = {ancestry}
			points_right = {points_right}/>
		<Widget_Title
			ancestry = {ancestry}
			name = {es_title.name}
			origin = {origin_ofTitle}
			fontSize = {k.font_size.common}px/>
		{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
			<Widget_Reveal
				ancestry = {ancestry}
				name = {es_reveal.name}
				points_toChild = {points_toChild}/>
		{/if}
	</div>
	{#if $w_show_related}
		{#each ancestry.g_widget.g_bidirectionalLines as g_line}
			<Tree_Line g_line = {g_line}/>
		{/each}
	{/if}
{/if}
