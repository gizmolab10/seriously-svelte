<script lang='ts'>
	import { k, u, Thing, Point, Angle, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_layout_asClusters, s_thing_fontFamily, s_path_editingTools } from '../../ts/state/State';
	import { s_path_focus, s_title_editing, s_paths_grabbed } from '../../ts/state/State';
	import { onMount, debugReact, IDWrapper } from '../../ts/common/GlobalImports';
	import EditingTools from '../graph/EditingTools.svelte';
	import { exemplar } from '../../ts/data/Exemplar';
	import TitleEditor from './TitleEditor.svelte';
	import DotReveal from './DotReveal.svelte';
	import DotDrag from './DotDrag.svelte';
    export let path = exemplar.onePath;
	export let origin = new Point(160, 5);
    export let angle = 0;
	const hasExtraAtLeft = !!path && !path.isExpanded && (path.childRelationships.length > 3);
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
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	onMount( () => {
		thing = path?.thing;
		if (!path || !thing) {
			console.log('bad path or thing');
		}
		updateBorderStyle();
		updateLayout();
		debugReact.log_mount(`WIDGET ${thing?.description} ${path?.isGrabbed}`);
		const handler = signals.handle_anySignal((kinds, id) => {
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
		return () => { handler.disconnect() };
	});


	$: {
		if (widget) {
			widgetWrapper = new Wrapper(widget, path, IDWrapper.widget);
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
		const _ = $s_title_editing + $s_paths_grabbed + $s_path_editingTools;
		fullUpdate();
	}

	function fullUpdate() {
		thing = path?.thing;
		if (!!path && thing) {
			const shallEdit = path.isEditing;
			const shallGrab = path.isGrabbed || (thing.isExemplar ?? false);
			const shallShowCluster = path.toolsGrabbed && !path.isFocus;
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
		thing = path?.thing;
		if (!thing) {
			console.log(`bad thing`);
		} else {			
			thing.updateColorAttributes(path);
			border = showingBorder ? `border: ${thing.grabAttributes}` : k.empty;
		}
	}

	function extraWidth() {
		return (k.dot_size * (path?.showsReveal ? 2 : 1.35)) +
		($s_layout_asClusters ? forward ? 0 : -8 : -18);
	}

	function updateLayout() {
		const dragX = $s_layout_asClusters ? 3.5 : 1.5;
		const titleWidth = thing?.titleWidth ?? 0;
		const delta = showingBorder ? 0 : 1;
		const leftForward = delta - dragX + 1;
		const leftBackward = -(titleWidth + 13 + (path.isGrabbed ? 1 : 0));
		dragCenter = new Point(forward ? dragX : titleWidth + 7, 2.8);
		left = origin.x + (forward ? leftForward : leftBackward);
		padding = `0px ${rightPadding}px 0px  ${leftPadding}px`;
		width = titleWidth + extraWidth();
		top = origin.y + delta + 0.5;
		height = k.row_height - 1.5;
		radius = k.row_height / 2;
		if (path?.showsReveal) {
			const revealY = k.dot_size / 2 - 3.8;
			const revealX = k.dot_size + titleWidth + (hasExtraAtLeft ? 3 : 0);
			revealCenter = new Point(revealX, revealY);
		}
	}

</script>

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
		path={path}
		center={dragCenter}
	/>
	<TitleEditor
		path={path}
		forward={forward}
		fontSize={k.thing_fontSize}px
		fontFamily={$s_thing_fontFamily}
	/>
	{#if path?.showsReveal}
		<DotReveal
			path={path}
			center={revealCenter}
		/>
	{/if}
</div>