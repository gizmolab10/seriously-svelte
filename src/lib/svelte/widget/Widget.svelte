<script lang='ts'>
	import { k, u, Thing, Point, debug, ZIndex, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_layout_byClusters, s_thing_fontFamily, s_path_clusterTools } from '../../ts/common/State';
	import { onMount, debugReact, IDSignal, IDWrapper } from '../../ts/common/GlobalImports';
	import { s_path_here, s_title_editing, s_paths_grabbed } from '../../ts/common/State';
	import ToolsCluster from './ToolsCluster.svelte';
	import EditorTitle from './EditorTitle.svelte';
	import DotReveal from './DotReveal.svelte';
	import DotDrag from './DotDrag.svelte';
	export let origin = new Point();
    export let thing;
    export let path;
	const hasExtraX = !path?.isExpanded && (path?.children_relationships.length > 3);
	const rightPadding = hasExtraX ? 22.5 : 19;
	const priorRowHeight = k.row_height;
	let revealCenter = new Point();
	let radius = k.dot_size / 2;
	let widgetWrapper: Wrapper;
	let showingCluster = false;
	let showingBorder = false;
	let priorOrigin = origin;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount( () => {
		if (path.thing == null) {
			console.log('bad thing');
			u.noop();
		}
		if (path) {
			thing = path.thing;
		}
		updateBorderStyle();
		updateLayout();
		debugReact.log_mount(`WIDGET ${path.thing.description} ${path.isGrabbed}`);
		const handler = signals.handle_anySignal((IDSignal, id) => {
			for (const kind of IDSignal) {
				switch (kind) {
					case IDSignal.relayout:
						if (id == path.thing.id) {
							debugReact.log_layout(`WIDGET signal ${path.thing.description}`);
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
				debugReact.log_layout(`WIDGET origin ${path.thing.description}`);
				updateLayout()
			}, 1);
			priorOrigin = origin;
		}
	}

	$: {
		const _ = $s_title_editing + $s_paths_grabbed + $s_path_clusterTools;
		fullUpdate();
	}

	function fullUpdate() {
		const shallEdit = path?.isEditing;
		const shallGrab = path?.isGrabbed || (path?.thing?.isExemplar ?? false);
		const shallShowCluster = path?.toolsGrabbed && !path?.isHere;
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
		if (!path?.thing) {
			console.log(`no thing ${path?.titles}`)
		}
		path?.thing.updateColorAttributes(path);
		border = showingBorder ? 'border: ' + path?.thing.grabAttributes : '';
		background = showingBorder ? 'background-color: ' + k.color_background : '';
	}

	function updateLayout() {
		const size = k.dot_size;
		const titleWidth = path?.thing.titleWidth;
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

<div class='widget' id='{path?.thing.title}'
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
	<EditorTitle path={path} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	{#if path?.showsReveal}
		<DotReveal path={path} center={revealCenter}/>
	{/if}
</div>