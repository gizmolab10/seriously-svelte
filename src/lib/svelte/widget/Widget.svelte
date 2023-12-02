<script lang='ts'>
	import { line_gap, dot_size, id_editing, ids_grabbed, id_showRevealCluster} from '../../ts/managers/State';
	import { k, Thing, Point, ZIndex, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import RevealCluster from './RevealCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
	const rightPadding = 22
	let showingCluster = false;
	let showingBorder = false;
	let isGrabbed = false;
	let isEditing = false;
	let radius = $dot_size;
	let background = '';
	let padding = '';
	let border = '';
	let yPadding = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount( () => {
		updateBorderStyle();
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}

	$: {
		const id = thing.id;
		const delta = showingBorder ? 0 : 1;
		const shouldEdit = (id == $id_editing);
		const shouldShowCluster = $id_showRevealCluster == id;
		const shouldGrab = $ids_grabbed?.includes(id) || thing.isExemplar;
		const change = (isEditing != shouldEdit || isGrabbed != shouldGrab || showingCluster != shouldShowCluster);
		left = origin.x + delta;
		if (change) {
			showingCluster = shouldShowCluster;
			showingBorder = shouldEdit || shouldGrab;
			isGrabbed = shouldGrab;
			isEditing = shouldEdit;
			updateBorderStyle();
		}
		if (thing.showCluster) {
			yPadding = radius - 17;
			radius = k.clusterHeight / 2;
			top = origin.y + delta - yPadding;
			const xPadding = $dot_size - 3.5;
			padding = yPadding + 'px ' + xPadding + 'px' + yPadding + 'px 0px';
		} else {
			yPadding = -2;
			radius = $dot_size / 2;
			top = origin.y + delta;
			if (thing.isExemplar) {
				const xPadding = rightPadding + 2;
				padding = '1px ' + xPadding + 'px 0px 0px';
			} else {
				padding = '0px ' + rightPadding + 'px 1px 0px';
			}
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
		padding: {padding};
		height: {$line_gap}px;
		z-index: {ZIndex.widgets};
		border-radius: {$line_gap / 1.5}px;
	'>
	<DragDot thing={thing}/>&nbsp;<TitleEditor thing={thing}/>
	<div class='revealDot'
		style='top:{yPadding}px'>
		<RevealDot thing={thing}/>
		{#if showingCluster}
			<RevealCluster thing={thing}/>
		{/if}
	</div>
</div>

<style>
	.widget {
		position: absolute;
		white-space: nowrap;
	}
	.revealDot {
		position: absolute;
	}
</style>