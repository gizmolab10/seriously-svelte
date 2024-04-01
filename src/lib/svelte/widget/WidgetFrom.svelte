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
	const priorRowHeight = k.row_height;
	let radius = k.dot_size / 2;
	let widgetWrapper: Wrapper;
	let priorOrigin = origin;
	let padding = '';
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let widget;

	onMount( () => {
		updateBorderStyle();
		updateLayout();
		const handler = signals.handle_anySignal((IDSignal, id) => {
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
				debugReact.log_layout(`WIDGET origin ${thing.description}`);
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
		updateBorderStyle();
		updateLayout();
	}

	function updateBorderStyle() {
		thing.updateColorAttributes(path);
	}

	function updateLayout() {
		const delta = 0.5;
		const size = k.dot_size;
		const titleWidth = thing.titleWidth;
		width = titleWidth - 18 + (size * 1.35);
		padding = `0px 22px 0px 1px`;
		top = origin.y + delta + 0.5;
		height = k.row_height - 1.5;
		left = origin.x + delta - 1;
		radius = k.row_height / 2;
	}

</script>

<div class='widget' id='{thing.title}'
	bind:this={widget}
	style='
		top: {top}px;
		left: {left}px;
		width: {width}px;
		height: {height}px;
		padding: {padding};
		position: absolute;
		white-space: nowrap;
		z-index: {ZIndex.widgets};
		border-radius: {radius}px;'>
	<DotDrag path={path}/>
	<EditorTitle path={path} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
</div>