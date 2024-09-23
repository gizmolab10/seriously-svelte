<script lang='ts'>
	import { s_thing_color, s_rings_mode, s_title_editing, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { s_thing_fontFamily, s_ancestries_grabbed, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { ElementType, Element_State, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { k, u, ux, Thing, Point, Angle, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { Tooltip } from 'carbon-components-svelte';
	import Editing_Tools from './Editing_Tools.svelte';
	import Title_Editor from './Title_Editor.svelte';
	import Dot_Reveal from './Dot_Reveal.svelte';
	import Dot_Drag from './Dot_Drag.svelte';
	export let origin = new Point(160, 5);
	export let subtype = k.empty;
    export let name = k.empty;
    export let forward = true;
    export let ancestry;
	const hasExtraAtLeft = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
	const revealState = ux.elementState_for(ancestry, ElementType.reveal, subtype);
	const dragState = ux.elementState_for(ancestry, ElementType.drag, subtype);
	const rightPadding = $s_rings_mode ? 0 : hasExtraAtLeft ? 22.5 : 20;
	const leftPadding = forward ? 1 : 14;
	const priorRowHeight = k.row_height;
	let widgetWrapper!: Svelte_Wrapper;
	let element_state!: Element_State;
	let revealCenter = Point.zero;
	let dragCenter = Point.zero;
	let radius = k.dot_size / 2;
	let showingBorder = false;
	let showingTools = false;
	let priorOrigin = origin;
	let background = k.empty;
	let widgetName = k.empty;
	let revealName = k.empty;
	let widgetData = k.empty;
	let revealData = k.empty;
	let dragData = k.empty;
	let isGrabbed = false;
	let isEditing = false;
	let backwards = false;
	let padding = k.empty;
	let border = k.empty;
	let rebuilds = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	onMount(() => {
		update_fromAncestry();
		layout_widget();
		element_state = ux.elementState_forName(name);		// survives onDestroy, created by {tree, cluster} children
		// debug.log_mount(`WIDGET ${thing?.description} ${ancestry?.isGrabbed}`);
		fullUpdate();
		const handleAny = signals.handle_anySignal((kinds, id) => {
			for (const kind of kinds) {
				switch (kind) {
					case kinds.relayout:
						if (id == thing?.id) {
							debug.log_layout(`WIDGET signal ${thing?.description}`);
							layout_widget()
						}
						break;
					default:
						fullUpdate();
						break;
				}
			}
		});
		return () => {
			handleAny.disconnect();
		};
	});
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		return false;
	}

	function update_fromAncestry() {
		thing = ancestry?.thing;
		if (!!ancestry && !!thing) {
			const title = thing.title ?? thing.id ?? k.unknown;
			widgetName = `widget ${title}`;
			revealName = `reveal ${title}`;
		} else {
			console.log('bad ancestry or thing');
		}
	}

	$: {
		if (!!thing && thing.id == $s_thing_color?.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (widget) {
			widgetWrapper = new Svelte_Wrapper(widget, handle_mouse_state, ancestry.idHashed, SvelteComponentType.widget);
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
		const _ = $s_title_editing + $s_ancestries_grabbed + $s_ancestry_showingTools;
		updateBorder_fromState();
	}

	function updateBorder_fromState() {
		if (!!widget) {
			widget.style.border = element_state.border;
			// widget.style.background-color = k.color_background;
		}
	}

	function fullUpdate() {
		thing = ancestry?.thing;
		if (!!ancestry && thing) {
			const shallEdit = ancestry.isEditing;
			const shallGrab = ancestry.isGrabbed;
			const shallShowTools = ancestry.toolsGrabbed && !ancestry.isFocus;
			const change = (isEditing != shallEdit || isGrabbed != shallGrab || showingTools != shallShowTools);
			if (change) {
				const showBackground = shallGrab || $s_rings_mode;
				background = showBackground ? `background-color: ${k.color_background};` : k.empty
				showingBorder = shallEdit || shallGrab;
				showingTools = shallShowTools;
				isGrabbed = shallGrab;
				isEditing = shallEdit;
				layout_widget();
			}
		}
	}

	function extraWidth() {
		const multiplier = ancestry?.showsReveal ? 2 : 1.35;
		const clustersAdjustment = $s_rings_mode ? (forward ? 16 : 0) : -10;
		return (k.dot_size * multiplier) + clustersAdjustment;
	}

	function layout_widget() {
		const dragX = 5.5;
		const delta = showingBorder ? 0 : 0.5;
		const leftForward = delta - dragX;
		const titleWidth = thing?.titleWidth ?? 0;
		const dragOffsetY = $s_rings_mode ? 2.8 : 2.3;
		const dragOffsetX = forward ? (dragX - 2) : (titleWidth + delta + 15);
		const leftBackward = -(titleWidth + 19 + ((ancestry?.isGrabbed ?? false) ? 0 : 0));		
		dragCenter = Point.square(k.dot_size / 2).offsetByXY(dragOffsetX, dragOffsetY);
		left = origin.x + delta + (forward ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px  ${leftPadding}px`;
		width = titleWidth + extraWidth();
		height = k.row_height - 1.5;
		radius = k.row_height / 2;
		top = origin.y + (showingBorder ? 0 : 1);
		if (ancestry?.showsReveal) {
			const revealY = k.dot_size - 4.2;
			const revealX = k.dot_size + titleWidth + 15;
			revealCenter = new Point(revealX, revealY);
		}
	}
		// <Tooltip
		// 	style='
		// 		display: flex;
		// 		align-items: center;
		// 		justify-content: center;'
		// 	align='center'
		// 	content='This is helpful information'>
		// </Tooltip>

</script>

{#key rebuilds, element_state}
	{#if element_state}
		<div class='widget' id='{widgetName}'
			bind:this={widget}
			style='
				{background};
				top: {top}px;
				left: {left}px;
				width: {width}px;
				height: {height}px;
				position: absolute;
				padding: {padding};
				border-radius: {radius}px;
				z-index: {ZIndex.widgets};
				border: {element_state.border};
			'>
			<Dot_Drag
				ancestry={ancestry}
				center={dragCenter}
				name={dragState.name}
			/>
			<Title_Editor
				forward={forward}
				ancestry={ancestry}
				fontSize={k.thing_fontSize}px
				fontFamily={$s_thing_fontFamily}
			/>
			{#if ancestry?.showsReveal}
				<Dot_Reveal
					ancestry={ancestry}
					center={revealCenter}
					name={revealState.name}
				/>
			{/if}
		</div>
	{/if}
{/key}
