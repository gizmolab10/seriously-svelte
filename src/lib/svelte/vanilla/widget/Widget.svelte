<script lang='ts'>
	import { k, Thing, Point, debug, ZIndex, signal, Signals, onMount, onDestroy, handleSignalOfKind } from '../../../ts/common/GlobalImports';
	import { row_height, dot_size, id_editing, ids_grabbed, user_graphOffset, id_showRevealCluster} from '../../../ts/managers/State';
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
	let yPadding = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount(() => { updateBorderStyle(); });

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}
	
	$: {
		if ($user_graphOffset != null || $row_height > 0 || origin != priorOrigin) {
			setTimeout(() => {
				updateLayout()
			}, 1);
			priorOrigin = origin;
		}
	}

	function updateLayout() {
		const delta = showingBorder ? 0 : 1;
		left = origin.x + delta - 2;
		const titleWidth = thing.titleWidth;
		width = titleWidth - 18 + ($dot_size * 2);
		thing.debugLog('TITLE WIDTH: ' + titleWidth);
		// debug.log_react(`WIDGET layout ${thing.description}`);
		if (thing.showCluster) {
			height = k.clusterHeight;
			radius = height / 2;
			yPadding = radius - 17;
			top = origin.y + delta - yPadding;
			const xPadding = $dot_size - 3.5;
			padding = yPadding + 'px ' + xPadding + 'px' + yPadding + 'px 0px';
		} else {
			yPadding = $dot_size / -3;
			height = $row_height - 2;
			radius = $dot_size / 2;
			top = origin.y + delta + 1;
			if (thing.isExemplar) {
				padding = '0px ' + rightPadding + 2 + 'px 0px 0px';
			} else {
				padding = '0px ' + rightPadding + 'px 0px 0px';
			}
		}
	}

	$: {
		const id = thing.id;
		const shouldEdit = (id == $id_editing);
		const shouldShowCluster = $id_showRevealCluster == id;
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
		border-radius: {$row_height / 1.5}px;
	'>
	<DragDot thing={thing}/>
	<TitleEditor thing={thing}/>
	<div class='revealDot'
		style='top:{yPadding}px'>
		<RevealDot thing={thing} center={origin}/>
		{#if showingCluster}
			<RevealCluster thing={thing}/>
		{/if}
	</div>
</div>