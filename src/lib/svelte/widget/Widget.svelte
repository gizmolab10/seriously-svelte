<script lang='ts'>
	import { g, k, u, ux, Thing, Point, Angle, debug, signals, S_Element, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Signal, T_Element, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_thing_color, w_t_graph } from '../../ts/state/S_Stores';
	import { w_thing_fontFamily, w_ancestries_grabbed } from '../../ts/state/S_Stores';
	import Title_Editor from './Title_Editor.svelte';
	import Dot_Reveal from './Dot_Reveal.svelte';
	import Dot_Drag from './Dot_Drag.svelte';
	import { onMount } from 'svelte';
	export let origin = new Point(160, 5);
	export let points_toChild = true;
    export let points_right = true;
    export let name = k.empty;
    export let ancestry;
	const priorRowHeight = k.row_height;
	const s_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
	const s_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	let s_widget = ux.s_element_forName(name);		// survives onDestroy, created by G_Widget
	let widgetWrapper!: Svelte_Wrapper;
	let revealCenter = Point.zero;
	let dragCenter = Point.zero;
	let radius = k.dot_size / 2;
	let priorOrigin = origin;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let dragData = k.empty;
	let isGrabbed = false;
	let isEditing = false;
	let padding = k.empty;
	let border = k.empty;
	let rebuilds = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	setup_fromAncestry();

	onMount(() => {
		layout_widget();
		debug.log_mount(`WIDGET ${thing?.description} ${isGrabbed}`);
		fullUpdate();
		const handleAny = signals.handle_anySignal_atPriority(3, (t_signal, ancestry) => {
			debug.log_layout(`WIDGET ${thing?.description}`);
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
		const _ = $w_s_title_edit + $w_ancestries_grabbed;
		updateBorder_fromState();
	}

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
				layout_widget()
			}, 1);
		}
	}
 
	function isHit(): boolean { return false; }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

	function updateBorder_fromState() {
		if (!!widget) {
			widget.style.border = s_widget.border;
		}
	}

	function extraWidth() {
		const multiplier = ancestry?.showsReveal ? 2 : 1.35;
		const clustersAdjustment = g.inRadialMode ? (points_right ? 14 : 0) : -10;
		return (k.dot_size * multiplier) + clustersAdjustment;
	}

	function setup_fromAncestry() {
		isGrabbed = ancestry?.isGrabbed;
		thing = ancestry?.thing;
		if (!ancestry) {
			console.log('bad ancestry');
		} else if (!thing) {
			console.log(`bad thing for "${ancestry?.id ?? 'indeed'}"`);
		} else {
			const title = thing.title ?? thing.id ?? k.unknown;
			widgetName = `widget ${title}`;
			revealName = `reveal ${title}`;
		}
	}

	function fullUpdate() {
		if (!!ancestry) {
			const shallEdit = ancestry.isEditing;
			const shallGrab = ancestry.isGrabbed;
			const change = (isEditing != shallEdit || isGrabbed != shallGrab);
			if (change) {
				const showBackground = shallGrab || g.inRadialMode;
				background = showBackground ? `background-color: ${k.color_background}` : k.empty
				isGrabbed = shallGrab;
				isEditing = shallEdit;
				layout_widget();
			}
		}
	}

	function layout_widget() {
		const dragX = 5.5;
		const showingReveal = ancestry?.showsReveal ?? false;
		const showingBorder = isEditing || isGrabbed;
		const titleWidth = thing?.titleWidth ?? 0;
		const deltaX = showingBorder ? 0 : 0.5;
		const leftForward = deltaX - dragX;
		const leftBackward = -(titleWidth + (showingReveal ? 25.5 : 15.5));
		const dragOffsetY = g.inRadialMode ? 2.8 : 2.7;
		const dragOffsetX = points_right ? (dragX - 1.5) : (titleWidth + deltaX + (showingReveal ? 22.5 : 14));
		const hasExtraForTinyDots = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
		const rightPadding = g.inRadialMode ? 0 : (hasExtraForTinyDots ? 0.5 : 0) + 21;
		const leftPadding = points_right ? 1 : 14;
		dragCenter = Point.square(k.dot_size / 2).offsetByXY(dragOffsetX, dragOffsetY);
		left = origin.x + deltaX + (points_right ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px ${leftPadding}px`;
		width = titleWidth + extraWidth();
		height = k.row_height - 1.5;
		radius = k.row_height / 2;
		top = origin.y + ((showingBorder && !ancestry.isRoot) ? 0 : 1);
		if (showingReveal) {
			const revealY = k.dot_size - 3.62;
			const revealX = points_right ? (k.dot_size + titleWidth + (g.inRadialMode ? 19 : 17)) : 9;
			revealCenter = new Point(revealX, revealY);
		}
		debug.log_layout(`WIDGET ${thing?.title ?? k.unknown}`);
		rebuilds += 1;
	}

</script>

{#key rebuilds}
	{#if s_widget}
		<div class='widget' id='{widgetName}'
			bind:this={widget}
			style='
				top: {top}px;
				left: {left}px;
				width: {width}px;
				height: {height}px;
				padding: {padding};
				position: absolute;
				border-radius: {radius}px;
				z-index: {T_Layer.widgets};
				border: {s_widget.border};
				background-color: {isGrabbed || g.inRadialMode ? k.color_background : 'transparent'};
			'>
			<Dot_Drag
				name={s_drag.name}
				ancestry={ancestry}
				center={dragCenter}
				points_right={points_right}
			/>
			<Title_Editor
				ancestry={ancestry}
				fontSize={k.font_size}px
				points_right={points_right}
			/>
			{#if ancestry?.showsReveal_forPointingToChild(points_toChild)}
				<Dot_Reveal
					ancestry={ancestry}
					name={s_reveal.name}
					center={revealCenter}
					points_toChild={points_toChild}
				/>
			{/if}
		</div>
	{/if}
{/key}
