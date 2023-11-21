<script lang='ts'>
	import { k, Thing, Point, ZIndex, onMount, Signals, onDestroy, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, dotSize, idEditing, idsGrabbed, idShowRevealCluster} from '../../ts/managers/State';
	import RevealCluster from './RevealCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
	const rightPadding = 26
	let showingCluster = false;
	let showingBorder = false;
	let toggleDraw = false;
	let isGrabbed = false;
	let isEditing = false;
	let radius = $dotSize;
	let background = '';
	let padding = '';
	let border = '';
	let yPadding = 0;
	let height = 0;
	let delta = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount( () => {
		updateBorderStyle();
		updatePosition();
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = showingBorder ? 'border: ' + thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.backgroundColor : '';
	}
	
	function updatePosition() {
		delta = showingBorder ? 0 : 1;
		left = origin.x + delta;
		height = $lineGap - 5;
		if (thing.showCluster) {
			yPadding = radius - 17;
			radius = k.clusterHeight / 2;
			top = origin.y + delta - yPadding;
			const xPadding = rightPadding - 3.5;
			padding = yPadding + 'px ' + xPadding + 'px' + yPadding + 'px 1px';
		} else {
			yPadding = 0;
			radius = $dotSize;
			top = origin.y + delta;
			if (thing.isExemplar) {
				const xPadding = rightPadding + 2;
				padding = '1px ' + xPadding + 'px 0px 1px';
			} else {
				padding = '0px ' + rightPadding + 'px 1px 1px';
			}
		}
	}

	$: {
		const id = thing.id;
		const shouldGrab = $idsGrabbed?.includes(id) || thing.isExemplar;
		const shouldShowCluster = $idShowRevealCluster == id;
		const shouldEdit = (id == $idEditing);
		const change = (isEditing != shouldEdit || isGrabbed != shouldGrab || showingCluster != shouldShowCluster);
		if (change) {
			showingCluster = shouldShowCluster;
			showingBorder = shouldEdit || shouldGrab;
			isGrabbed = shouldGrab;
			isEditing = shouldEdit;
			updateBorderStyle();
			updatePosition();
			toggleDraw = !toggleDraw;
		}
	}

</script>

{#key toggleDraw}
	<div class='widget' id='{thing.title}'
		bind:this={widget}
		style='
			top: {top}px;
			left: {left}px;
			height: {height}px;
			padding: {padding};
			border-radius: {radius}px;
			z-index: {ZIndex.widgets};
			{background};
			{border};
		'>
		<DragDot thing={thing}/>&nbsp;<TitleEditor thing={thing}/>
		<div class='reveal'
			style='top:{yPadding}px'>
			<RevealDot thing={thing}/>
			{#if showingCluster}
				<RevealCluster thing={thing}/>
			{/if}
		</div>
	</div>
{/key}

<style>
	.widget {
		position: absolute;
		white-space: nowrap;
	}
	.reveal {
		position: absolute;
	}
</style>