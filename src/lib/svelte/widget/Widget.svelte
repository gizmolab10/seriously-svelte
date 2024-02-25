<script lang='ts'>
	import { s_dot_size, s_path_here, s_row_height, s_title_editing, s_paths_grabbed, } from '../../ts/managers/State';
	import { s_thing_fontSize, s_thing_fontFamily, s_path_toolsCluster } from '../../ts/managers/State';
	import { onMount, onDestroy, debugReact, IDSignal, IDWrapper } from '../../ts/common/GlobalImports';
	import { k, Thing, Point, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import ToolsCluster from './ToolsCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
    export let path = '';
	let priorRowHeight = $s_row_height;
	let radius = $s_dot_size / 2;
	let widgetWrapper: Wrapper;
	let showingCluster = false;
	let showingBorder = false;
	let priorOrigin = origin;
	let isGrabbed = false;
	let isEditing = false;
	let rightPadding = 19;
	let background = '';
	let revealTop = 0;
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
		if (priorRowHeight != $s_row_height) {
			setTimeout(() => {
				debugReact.log_layout(`WIDGET $s_row_height ${thing.description}`);
				updateLayout()
			}, 1);
			priorRowHeight = $s_row_height;
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
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}

	function updateLayout() {
		const titleWidth = thing.titleWidth;
		const delta = showingBorder ? -0.5 : 0.5;
		width = titleWidth - 18 + ($s_dot_size * 2);
		padding = `0px ${rightPadding}px 0px 1px`;
		revealTop = $s_dot_size / -3 + 0.5;
		height = $s_row_height - 1.5;
		left = origin.x + delta - 1;
		radius = $s_row_height / 2;
		top = origin.y + delta;
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
	<DragDot thing={thing} path={path} center={new Point(0.5, revealTop)}/>
	<TitleEditor thing={thing} path={path} fontSize={$s_thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	<RevealDot thing={thing} path={path} center={new Point(-0.5, revealTop + 0.5)}/>
</div>