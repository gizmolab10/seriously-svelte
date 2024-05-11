<script lang='ts'>
	import { k, u, Thing, Point, Angle, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_layout_asClusters, s_thing_fontFamily, s_ancestry_editingTools } from '../../ts/state/State';
	import { s_ancestry_focus, s_title_editing, s_ancestries_grabbed } from '../../ts/state/State';
	import { onMount, debugReact, IDWrapper } from '../../ts/common/GlobalImports';
	import EditingTools from '../graph/EditingTools.svelte';
	import { exemplar } from '../../ts/data/Exemplar';
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
	let revealCenter = new Point();
	let dragCenter = new Point();
	let radius = k.dot_size / 2;
	let widgetWrapper: Wrapper;
	let showingCluster = false;
	let showingBorder = false;
	let priorOrigin = origin;
	let background = k.empty;
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

	onMount( () => {
		thing = ancestry?.thing;
		if (!ancestry || !thing) {
			console.log('bad ancestry or thing');
		}
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
		const handleChanges = signals.hangle_thingChanged(0, thing?.id ?? k.empty, (value: any) => {
			updateBorderStyle();
			rebuilds += 1;
		});
		return () => {
			handleAny.disconnect()
			handleChanges.disconnect();
		};
	});


	$: {
		if (widget) {
			widgetWrapper = new Wrapper(widget, ancestry, IDWrapper.widget);
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
			const shallGrab = ancestry.isGrabbed || (thing.isExemplar ?? false);
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
		background = showingBorder ? `background-color: ${k.color_background}` : k.empty;
		thing = ancestry?.thing;
		if (!thing) {
			console.log(`bad thing`);
		} else {			
			thing.updateColorAttributes(ancestry);
			border = showingBorder ? `border: ${thing.grabAttributes}` : k.empty;
		}
	}

	function extraWidth() {
		return (k.dot_size * (ancestry?.showsReveal ? 2 : 1.35)) +
		($s_layout_asClusters ? forward ? 0 : -8 : -18);
	}

	function updateLayout() {
		const dragX = $s_layout_asClusters ? 3.5 : 1.5;
		const titleWidth = thing?.titleWidth ?? 0;
		const delta = showingBorder ? 0 : 1;
		const leftForward = delta - dragX + 1;
		const leftBackward = -(titleWidth + 13 + ((ancestry?.isGrabbed ?? false) ? 1 : 0));
		dragCenter = new Point(forward ? dragX : titleWidth + 7, 2.8);
		left = origin.x + (forward ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px  ${leftPadding}px`;
		width = titleWidth + extraWidth();
		top = origin.y + delta + 0.5;
		height = k.row_height - 1.5;
		radius = k.row_height / 2;
		if (ancestry?.showsReveal) {
			const revealY = k.dot_size / 2 - 3.8;
			const revealX = k.dot_size + titleWidth + (hasExtraAtLeft ? 3 : 0);
			revealCenter = new Point(revealX, revealY);
		}
	}

</script>

{#key rebuilds}
	<div class='widget' id='{thing?.title}'
		bind:this={widget}
		style='
			{border};
			{background};
			top: {top}px;
			left: {left}px;
			width: {width}px;
			height: {height}px;
			padding: {padding};
			position: absolute;
			white-space: nowrap;
			z-index: {ZIndex.widgets};
			border-radius: {radius}px;
		'>
		<DotDrag
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
