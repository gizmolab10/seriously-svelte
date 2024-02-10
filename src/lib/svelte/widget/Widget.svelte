<script lang='ts'>
	import { s_path_toolsCluster, s_tools_inWidgets, s_thing_fontSize, s_thing_fontFamily } from '../../ts/managers/State';
	import { s_title_editing, s_dot_size, s_path_here, s_row_height, s_paths_grabbed, } from '../../ts/managers/State';
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
	let widgetWrapper: Wrapper;
	let priorOrigin = origin;
	let showingCluster = false;
	let showingBorder = false;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let radius = $s_dot_size / 2;
	let rightPadding = 19;
	let revealTop = 0;
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
		const willEdit = (path.isEditing);
		const willGrab = path.isGrabbed || thing.isExemplar;
		const willShowCluster = path.toolsGrabbed && !path.isHere;
		const change = (isEditing != willEdit || isGrabbed != willGrab || showingCluster != willShowCluster);
		if (change) {
			showingBorder = willEdit || willGrab;
			showingCluster = willShowCluster;
			isGrabbed = willGrab;
			isEditing = willEdit;
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
		height = $s_row_height - 2;
		const delta = showingBorder ? 0 : 1;
		left = origin.x + delta - 1;
		const titleWidth = thing.titleWidth;
		width = titleWidth - 18 + ($s_dot_size * 2);
		if (path.toolsGrabbed && $s_tools_inWidgets) {
			radius = k.toolsClusterHeight / 2;
			const yPadding = radius - 12;
			revealTop = radius - 17;
			top = origin.y + delta - yPadding + 1;
			padding = `${yPadding}px ${rightPadding}px ${yPadding}px 0px`;
		} else {
			revealTop = $s_dot_size / -3 + 1;
			radius = $s_row_height / 2;
			top = origin.y + delta;
			padding = `0px ${rightPadding}px 0px 0px`;
		}
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
	<DragDot path={path} center={new Point(0, revealTop)}/>
	<TitleEditor path={path} fontSize={$s_thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	<RevealDot path={path} center={new Point(0, revealTop)}/>
	{#if showingCluster && $s_tools_inWidgets}
		<ToolsCluster path={path}/>
	{/if}
</div>