<script lang='ts'>
	import { k, noop, Thing, Point, ZIndex, onMount, Signals, onDestroy, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, idEditing, idsGrabbed, idShowRevealCluster} from '../../ts/managers/State';
	import RevealCluster from './RevealCluster.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import RevealDot from './RevealDot.svelte';
	import DragDot from './DragDot.svelte';
	export let origin = new Point();
	export let thing = Thing;
	let showingCluster = false;
	let showingBorder = false;
	let toggleDraw = false;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let revealTop = 0;
	let radius = 16;
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
			radius = k.clusterHeight / 2;
			revealTop = radius - 12;
			padding = revealTop + 'px 15px ' + revealTop + 'px 1px';
			top = origin.y + delta - revealTop;
		} else {
			radius = 16;
			revealTop = 0;
			top = origin.y + delta;
			if (thing.isExemplar) {
				padding = '1px 15px 0px 1px';
			} else {
				padding = '0px 13px 1px 1px';
			}
		}
	}

	$: {
		const id = thing.id;
		const shouldEdit = (id == $idEditing);
		const shouldShowCluster = $idShowRevealCluster == id;
		const shouldGrab = $idsGrabbed?.includes(id) || thing.isExemplar;
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
		style='z-index: {ZIndex.highlights};
			top: {top}px;
			left: {left}px;
			height: {height}px;
			padding: {padding};
			border-radius: {radius}px;
			{background};
			{border};'>
		<DragDot thing={thing}/>&nbsp;<TitleEditor thing={thing}/>
		<div class='at-right'
			style='top:{revealTop}px'>
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
	.at-right {
		position: absolute;
	}
</style>