<script lang='ts'>
	import { id_here, dot_size, id_editing, row_height, ids_grabbed, id_showingTools} from '../../../ts/managers/State';
	import { k, Thing, Point, debug, ZIndex, onMount, onDestroy, debugReact } from '../../../ts/common/GlobalImports';
	import RevealCluster from './RevealCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot, {center} from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
	let priorOrigin = origin;
	let showingCluster = false;
	let showingBorder = false;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let radius = $dot_size / 2;
	let rightPadding = 22
	let revealTop = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount( () => {
		updateBorderStyle();
		debugReact.log_mount(`WIDGET ${thing.description}`);
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}
	
	$: {
		if ($row_height > 0 || origin != priorOrigin) {
			setTimeout(() => {
				updateLayout()
			}, 1);
			priorOrigin = origin;
		}
	}

	function updateLayout() {
		height = $row_height - 2;
		const delta = showingBorder ? 0 : 1;
		left = origin.x + delta - 2;
		const titleWidth = thing.titleWidth;
		width = titleWidth - 18 + ($dot_size * 2);
		thing.debugLog('TITLE WIDTH: ' + titleWidth);
		// debugReact.log_layout(`WIDGET layout ${thing.description}`);
		if (thing.showCluster) {
			radius = k.clusterHeight / 2;
			const yPadding = radius - 12;
			revealTop = radius - 17;
			top = origin.y + delta - yPadding + 1;
			padding = `${yPadding}px ${rightPadding}px ${yPadding}px 0px`;
		} else {
			revealTop = $dot_size / -3;
			radius = $row_height / 2;
			top = origin.y + delta + 1;
			padding = `0px ${rightPadding}px 0px 0px`;
		}
	}

	$: {
		const id = thing.id;
		const shouldEdit = (id == $id_editing);
		const shouldShowCluster = $id_showingTools == id && $id_here != id;
		const shouldGrab = $ids_grabbed?.includes(id) || thing.isExemplar;
		const change = (isEditing != shouldEdit || isGrabbed != shouldGrab || showingCluster != shouldShowCluster);
		if (change) {
			showingCluster = shouldShowCluster;
			showingBorder = shouldEdit || shouldGrab;
			isGrabbed = shouldGrab;
			isEditing = shouldEdit;
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
	bind:this={widget}
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
	<DragDot thing={thing}/>
	<TitleEditor thing={thing}/>
	<div class='revealDot'
		style='
			top:{revealTop}px;
			z-index: {ZIndex.dots};'>
		<RevealDot thing={thing} center={origin}/>
	</div>
	{#if showingCluster}
		<RevealCluster thing={thing}/>
	{/if}
</div>