<script lang='ts'>
	import { k, Thing, Point, debug, ZIndex, Widget, signals, onMount, onDestroy, debugReact } from '../../ts/common/GlobalImports';
	import { s_path_here, s_dot_size, s_row_height, s_paths_grabbed } from '../../ts/managers/State';
	import { s_path_toolsGrab, s_thing_fontSize, s_thing_fontFamily } from '../../ts/managers/State';
	import ToolsCluster from './ToolsCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
    export let path = '';
	let priorRowHeight = $s_row_height;
	let priorOrigin = origin;
	let showingCluster = false;
	let showingBorder = false;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let widget: Widget;
	let radius = $s_dot_size / 2;
	let rightPadding = 19;
	let revealTop = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;

	onDestroy( () => { signalHandler.disconnect(); });

	onMount( () => {
		updateBorderStyle();
		debugReact.log_mount(`WIDGET ${thing.description}`);
	});
	
	const signalHandler = signals.handle_relayout((id) => {
		if (id == thing.id) {
			debugReact.log_layout(`WIDGET signal ${thing.description}`);
			updateLayout()
		}
	});

	function updateBorderStyle() {
		thing.updateColorAttributes(path);
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}

	$: {
		const _ = path;
		widget = new Widget(this, path, thing);
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

	$: {
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
		<DragDot thing={thing} widget={widget}/>
	</div>
	<TitleEditor thing={thing} widget={widget} fontSize={$s_thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	<div class='revealDot'
		style='
			top:{revealTop + 0.3}px;
			z-index: {ZIndex.dots};'>
		<RevealDot thing={thing} widget={widget}/>
	</div>
	{#if showingCluster}
		<ToolsCluster thing={thing} widget={widget}/>
	{/if}
</div>