<script lang='ts'>
	import { k, s, u, Thing, Point, Angle, debug, ZIndex, onMount, signals, debugReact } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_title_editing, s_ancestry_focus, s_ancestries_grabbed } from '../../ts/state/ReactiveState';
	import { s_thing_fontFamily, s_layout_asClusters, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { ElementType, ElementState, SvelteWrapper, SvelteComponentType } from '../../ts/common/GlobalImports';
	import EditingTools from './EditingTools.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import DotReveal from './DotReveal.svelte';
	import DotDrag from './DotDrag.svelte';
	export let origin = new Point(160, 5);
	export let subtype = k.empty;
    export let name = k.empty;
    export let angle = 0;
    export let ancestry;
	const hasExtraAtLeft = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
	const revealState = s.elementState_for(ancestry, ElementType.reveal, subtype);
	const rightPadding = $s_layout_asClusters ? 0 : hasExtraAtLeft ? 22.5 : 20;
	const dragState = s.elementState_for(ancestry, ElementType.drag, subtype);
	const forward = angle <= Angle.quarter || angle >= Angle.threeQuarters;
	const leftPadding = forward ? 1 : 14;
	const priorRowHeight = k.row_height;
	let widgetWrapper: SvelteWrapper;
	let elementState!: ElementState;
	let revealCenter = Point.zero;
	let dragCenter = Point.zero;
	let radius = k.dot_size / 2;
	let showingCluster = false;
	let showingBorder = false;
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
		updateLayout();
		elementState = s.elementState_forName(name);		// survives onDestroy, created by {tree, cluster} children
		debugReact.log_mount(`WIDGET ${thing?.description} ${ancestry?.isGrabbed}`);
		fullUpdate();
		const handleAny = signals.handle_anySignal((kinds, id) => {
			for (const kind of kinds) {
				switch (kind) {
					case kinds.relayout:
						if (id == thing?.id) {
							debugReact.log_layout(`WIDGET signal ${thing?.description}`);
							updateLayout()
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

	function update_fromAncestry() {
		thing = ancestry?.thing;
		const title = thing?.title ?? thing?.id ?? k.unknown;
		widgetName = `widget ${title}`;
		revealName = `reveal ${title}`;
		if (!ancestry || !thing) {
			console.log('bad ancestry or thing');
		}
	}

	$: {
		if (thing?.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (widget) {
			widgetWrapper = new SvelteWrapper(widget, ancestry, SvelteComponentType.widget);
		}
	}
	
	$: {
		if (priorOrigin != origin) {
			priorOrigin = origin;
			setTimeout(() => {
				updateLayout()
			}, 1);
		}
	}

	$: {
		const _ = $s_title_editing + $s_ancestries_grabbed + $s_ancestry_editingTools;
		updateBorder_fromState();
	}

	function updateBorder_fromState() {
		if (!!widget) {
			widget.style.border = elementState.border;
		}
	}

	function fullUpdate() {
		thing = ancestry?.thing;
		if (!!ancestry && thing) {
			const shallEdit = ancestry.isEditing;
			const shallGrab = ancestry.isGrabbed;
			const shallShowCluster = ancestry.toolsGrabbed && !ancestry.isFocus;
			const change = (isEditing != shallEdit || isGrabbed != shallGrab || showingCluster != shallShowCluster);
			if (change) {
				showingBorder = shallEdit || shallGrab;
				showingCluster = shallShowCluster;
				isGrabbed = shallGrab;
				isEditing = shallEdit;
				updateLayout();
			}
		}
	}

	function extraWidth() {
		const multiplier = ancestry?.showsReveal ? 2 : 1.35;
		const clustersAdjustment = $s_layout_asClusters ? (forward ? 16 : 0) : -10;
		return (k.dot_size * multiplier) + clustersAdjustment;
	}

	function updateLayout() {
		const dragX = 5.5;
		const delta = showingBorder ? 0 : 0.5;
		const leftForward = delta - dragX;
		const titleWidth = thing?.titleWidth ?? 0;
		const dragOffsetY = $s_layout_asClusters ? 2.8 : 2.3;
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

</script>

{#key rebuilds}
	{#if elementState}
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
				border: {elementState.border};
			'>
			<DotDrag
				ancestry={ancestry}
				center={dragCenter}
				name={dragState.name}
			/>
			<TitleEditor
				forward={forward}
				ancestry={ancestry}
				fontSize={k.thing_fontSize}px
				fontFamily={$s_thing_fontFamily}
			/>
			{#if ancestry?.showsReveal}
				<DotReveal
					ancestry={ancestry}
					center={revealCenter}
					name={revealState.name}
				/>
			{/if}
		</div>
	{/if}
{/key}
