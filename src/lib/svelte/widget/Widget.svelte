<script lang='ts'>
	import { k, Thing, Point, debug, ZIndex, Wrapper, signals, onMount, onDestroy, debugReact, SignalKind, SvelteType } from '../../ts/common/GlobalImports';
	import { s_title, s_dot_size, s_path_here, s_row_height, s_paths_grabbed, } from '../../ts/managers/State';
	import { s_path_toolsGrab, s_thing_fontSize, s_thing_fontFamily } from '../../ts/managers/State';
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

	onDestroy( () => { any_signalHandler.disconnect(); });

	onMount( () => {
		updateBorderStyle();
		debugReact.log_mount(`WIDGET ${thing.description}`);
	});

	const any_signalHandler = signals.handleAnySignal((kinds, id) => {
		for (const kind of kinds) {
			switch (kind) {
				case SignalKind.relayout:
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
		widgetWrapper = new Wrapper(this, path, SvelteType.widget);
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
		const _ = $s_title + $s_paths_grabbed + $s_path_toolsGrab;
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
		left = origin.x + delta - 2;
		const titleWidth = thing.titleWidth;
		width = titleWidth - 18 + ($s_dot_size * 2);
		if (path.toolsGrabbed) {
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

<style>
	.widget {
		position: absolute;
		white-space: nowrap;
	}
	.revealDot {
		position: absolute;
	}
</style>

<div class='widget' id='{thing.title}'
	style='
		{border};
		{background};
		top: {top}px;
		left: {left}px;
		width: {width}px;
		height: {height}px;
		padding: {padding};
		z-index: {ZIndex.widgets};
		border-radius: {radius}px;
	'>
	<div style='top:{revealTop}px;'>
		<DragDot thing={thing} widgetWrapper={widgetWrapper}/>
	</div>
	<TitleEditor thing={thing} widgetWrapper={widgetWrapper} fontSize={$s_thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	<div class='revealDot'
		style='
			top:{revealTop + 0.3}px;
			z-index: {ZIndex.dots};'>
		<RevealDot thing={thing} widgetWrapper={widgetWrapper}/>
	</div>
	{#if showingCluster}
		<ToolsCluster thing={thing} widgetWrapper={widgetWrapper}/>
	{/if}
</div>