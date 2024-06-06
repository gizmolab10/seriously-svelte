<script lang='ts'>
	import { s_thing_changed, s_title_editing, s_ancestry_focus, s_ancestries_grabbed } from '../../ts/state/ReactiveState';
	import { s_layout_asClusters, s_thing_fontFamily, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { k, u, Thing, Point, Angle, debug, ZIndex, SvelteWrapper } from '../../ts/common/GlobalImports';
	import { signals, onMount, debugReact, SvelteComponentType } from '../../ts/common/GlobalImports';
	import EditingTools from './EditingTools.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import DotReveal from './DotReveal.svelte';
	import DotDrag from './DotDrag.svelte';
	export let origin = new Point(160, 5);
    export let angle = 0;
    export let ancestry;
	const hasExtraAtLeft = !!ancestry && !ancestry.isExpanded && (ancestry.childRelationships.length > 3);
	const rightPadding = $s_layout_asClusters ? 0 : hasExtraAtLeft ? 22.5 : 19;
	const forward = angle <= Angle.quarter || angle >= Angle.threeQuarters;
	const leftPadding = forward ? 1 : 14;
	const priorRowHeight = k.row_height;
	let widgetWrapper: SvelteWrapper;
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
	let dragName = k.empty;
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
		updateBorderStyle();
		updateLayout();
		debugReact.log_mount(`WIDGET ${thing?.description} ${ancestry?.isGrabbed}`);
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
		dragName = `drag ${title}`;
		if (!ancestry || !thing) {
			console.log('bad ancestry or thing');
		}
	}

	$: {
		if (thing?.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateBorderStyle();
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
		fullUpdate();
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
				updateBorderStyle();
				updateLayout();
			}
		}
	}

	function updateBorderStyle() {
		background = (showingBorder || $s_layout_asClusters) ? `background-color: ${k.color_background}` : k.empty;
		thing = ancestry?.thing;
		if (!thing) {
			console.log(`bad thing`);
		} else {			
			thing.updateColorAttributes(ancestry);
			border = showingBorder ? `border: ${thing.grabAttributes}` : k.empty;
		}
	}

	function extraWidth() {
		const multiplier = ancestry?.showsReveal ? 2 : 1.35;
		const clustersAdjustment = $s_layout_asClusters ? forward ? 0 : 8 : 18;
		return (k.dot_size * multiplier) - clustersAdjustment;
	}

	function updateLayout() {
		const dragX = 5.5;
		const titleWidth = thing?.titleWidth ?? 0;
		const delta = showingBorder ? 1.5 : 2;
		const leftForward = delta - dragX;
		const dotCenter = Point.square(k.dot_size / 2)
		const x = forward ? dragX : titleWidth + delta + 15;
		const leftBackward = -(titleWidth + 19 + ((ancestry?.isGrabbed ?? false) ? 1 : 0));		
		dragCenter = Point.square(k.dot_size / 2).offsetByXY(x - 5, 2.6);
		left = origin.x + delta + (forward ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px  ${leftPadding}px`;
		width = titleWidth + extraWidth() + 12;
		height = k.row_height - 1.5;
		radius = k.row_height / 2;
		top = origin.y + (showingBorder ? 0 : 1);
		if (ancestry?.showsReveal) {
			const revealY = k.dot_size / 2 - 3.8;
			const revealX = k.dot_size + titleWidth + (hasExtraAtLeft ? 9 : 6);
			revealCenter = new Point(revealX, revealY);
		}
	}

</script>

{#key rebuilds}
	<div class='widget' id='{widgetName}'
		bind:this={widget}
		style='
			{border};
			{background};
			top: {top}px;
			left: {left}px;
			width: {width}px;
			height: {height}px;
			position: absolute;
			padding: {padding};
			border-radius: {radius}px;
			z-index: {ZIndex.widgets};
		'>
		<DotDrag
			name={dragName}
			ancestry={ancestry}
			center={dragCenter}
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
			/>
		{/if}
	</div>
{/key}
