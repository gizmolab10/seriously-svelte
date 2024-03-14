<script lang='ts'>
	import { s_path_here, s_title_editing, s_paths_grabbed, } from '../../ts/common/State';
	import { onMount, onDestroy, debugReact, IDSignal, IDWrapper } from '../../ts/common/GlobalImports';
	import { k, Thing, Point, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_thing_fontFamily, s_path_toolsCluster } from '../../ts/common/State';
	import ToolsCluster from './ToolsCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
    export let path = '';
	export let thing;
	const hasExtraX = !path.isExpanded && (path.children.length > 3);
	const rightPadding = hasExtraX ? 23 : 19;
	const priorRowHeight = k.row_height;
	let revealCenter = new Point();
	let radius = k.dot_size / 2;
	let widgetWrapper: Wrapper;
	let showingCluster = false;
	let showingBorder = false;
	let priorOrigin = origin;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let widget;

	onDestroy( () => { any_signalHandler.disconnect(); });

	onMount( () => {
		updateBorderStyle();
		updateLayout();
		debugReact.log_mount(`WIDGET ${thing.description}`);
	});

	const any_signalHandler = signals.handleAnySignal((IDSignal, id) => {
		for (const kind of IDSignal) {
			switch (kind) {
				case IDSignal.relayout:
					if (id == thing.id) {
						debugReact.log_layout(`WIDGET signal ${thing.description}`);
						updateLayout()
					}
					break;
				default:
					fullUpdate();
					break;
			}
		}

	});

	$: {
		if (widget) {
			widgetWrapper = new Wrapper(widget, path, IDWrapper.widget);
		}
	}
	
	$: {
		if (priorOrigin != origin) {
			setTimeout(() => {
				debugReact.log_layout(`WIDGET origin ${thing.description}`);
				updateLayout()
			}, 1);
			priorOrigin = origin;
		}
	}

	$: {
		const _ = $s_title_editing + $s_paths_grabbed + $s_path_toolsCluster;
		fullUpdate();
	}

	function fullUpdate() {
		const shallEdit = (path.isEditing);
		const shallGrab = path.isGrabbed || (thing?.isExemplar ?? false);
		const shallShowCluster = path.toolsGrabbed && !path.isHere;
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

	function updateBorderStyle() {
		thing.updateColorAttributes(path);
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.color_background : '';
	}

	function updateLayout() {
		const y = k.dot_size / 2 - 4.2;
		const titleWidth = thing.titleWidth;
		const delta = showingBorder ? -0.5 : 0.5;
		const x = k.dot_size + thing.titleWidth + (hasExtraX ? 3 : 0);
		width = titleWidth - 18 + (k.dot_size * (path.hasChildren ? 2 : 1.35));
		padding = `0px ${rightPadding}px 0px 1px`;
		revealCenter = new Point(x, y);
		top = origin.y + delta + 0.5;
		height = k.row_height - 1.5;
		left = origin.x + delta - 1;
		radius = k.row_height / 2;
	}

</script>

<div class='widget' id='{thing.title}'
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
	<DragDot thing={thing} path={path}/>
	<TitleEditor thing={thing} path={path} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	{#if path.hasChildren}
		<RevealDot thing={thing} path={path} center={revealCenter}/>
	{/if}
</div>