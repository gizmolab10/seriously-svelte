<script lang='ts'>
	import { k, u, Thing, Point, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_layout_byClusters, s_thing_fontFamily, s_path_graphTools } from '../../ts/common/State';
	import { onMount, debugReact, IDSignal, IDWrapper } from '../../ts/common/GlobalImports';
	import { s_path_focus, s_title_editing, s_paths_grabbed } from '../../ts/common/State';
	import EditingTools from '../graph/EditingTools.svelte';
	import TitleEditor from './TitleEditor.svelte';
	import DotReveal from './DotReveal.svelte';
	import DotDrag from './DotDrag.svelte';
	export let origin = new Point();
    export let clockwise_radians = 0;
    export let path;
	const hasExtraX = !path?.isExpanded && (path?.childRelationships.length > 3);
	const rightPadding = hasExtraX ? 22.5 : 19;
	const priorRowHeight = k.row_height;
	let revealCenter = new Point();
	let radius = k.dot_size / 2;
	let widgetWrapper: Wrapper;
	let showingCluster = false;
	let showingBorder = false;
	let priorOrigin = origin;
	let background = k.empty;
	let isGrabbed = false;
	let isEditing = false;
	let padding = k.empty;
	let border = k.empty;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
    let widget;
	let thing;

	onMount( () => {
		if (!path || !path.thing) {
			console.log('bad path or thing');
		}
		if (path) {
			thing = path.thing;
		}
		updateBorderStyle();
		updateLayout();
		debugReact.log_mount(`WIDGET ${thing?.description} ${path?.isGrabbed}`);
		const handler = signals.handle_anySignal((IDSignal, id) => {
			for (const kind of IDSignal) {
				switch (kind) {
					case IDSignal.relayout:
						if (id == thing?.id) {
							debugReact.log_layout(`WIDGET signal ${thing?.description}`);
							updateLayout()
						}
						break;
					default:
						fullUpdate();
						break;
				}
			}
	
		});
		return () => { handler.disconnect() };
	});


	$: {
		if (widget) {
			widgetWrapper = new Wrapper(widget, path, IDWrapper.widget);
		}
	}
	
	$: {
		if (priorOrigin != origin) {
			setTimeout(() => {
				debugReact.log_layout(`WIDGET origin ${thing?.description}`);
				updateLayout()
			}, 1);
			priorOrigin = origin;
		}
	}

	$: {
		const _ = $s_title_editing + $s_paths_grabbed + $s_path_graphTools;
		fullUpdate();
	}

	function fullUpdate() {
		const shallEdit = path?.isEditing;
		const shallGrab = path?.isGrabbed || (thing?.isExemplar ?? false);
		const shallShowCluster = path?.toolsGrabbed && !path?.isFocus;
		const change = (isEditing != shallEdit || isGrabbed != shallGrab || showingCluster != shallShowCluster);
		if (change) {
			showingBorder = (shallEdit || shallGrab) && !$s_layout_byClusters;
			showingCluster = shallShowCluster;
			isGrabbed = shallGrab;
			isEditing = shallEdit;
			updateBorderStyle();
			updateLayout();
		}
	}

	function updateBorderStyle() {
		thing = path?.thing;
		if (!thing) {
			console.log(`bad thing`);
		}
		thing?.updateColorAttributes(path);
		border = showingBorder ? 'border: ' + thing?.grabAttributes : k.empty;
		background = showingBorder ? 'background-color: ' + k.color_background : k.empty;
	}

	function updateLayout() {
		const size = k.dot_size;
		const titleWidth = thing?.titleWidth;
		const delta = showingBorder ? -0.5 : 0.5;
		width = titleWidth - 18 + (size * (path?.showsReveal ? 2 : 1.35));
		padding = `0px ${rightPadding}px 0px 1px`;
		top = origin.y + delta + 0.5;
		height = k.row_height - 1.5;
		left = origin.x + delta - 1;
		radius = k.row_height / 2;
		if (path?.showsReveal) {
			const y = size / 2 - 3.8;
			const x = size + titleWidth + (hasExtraX ? 3 : 0);
			revealCenter = new Point(x, y);
		}
	}

</script>

<div class='widget' id='{thing?.title}'
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
	<DotDrag path={path}/>
	<TitleEditor path={path} clockwise_radians={clockwise_radians} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	{#if path?.showsReveal}
		<DotReveal path={path} center={revealCenter}/>
	{/if}
</div>