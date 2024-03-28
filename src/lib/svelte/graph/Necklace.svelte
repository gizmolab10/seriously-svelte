<script lang='ts'>
	import { k, Path, Point, ZIndex, onMount, signals, transparentize } from '../../ts/common/GlobalImports';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Line from '../widget/Line.svelte';
	export let center: Point;
	export let path: Path;
	let childOffset: Point;
	let childPath: Path;
	
	onMount( () => {
		layoutNecklace();
		const paths = path.childPaths;
		if (paths.length > 0) {
			childPath = paths[0];
			childOffset = new Point(k.circle_necklace_radius - k.dot_size / 3, k.circle_offsetY);
		}
		const handler = signals.handle_relayoutWidgets((signal_path) => {});
		return () => { handler.disconnect() };
	});
	
	function layoutNecklace() {}
	
	// needs:
	//  hover
</script>

<Circle
	center={center}
	zindex=ZIndex.lines
	color_background='transparent'
	radius={k.circle_necklace_radius}
	color={transparentize(path.thing.color, 0.8)}/>
{#if childPath}
	<Widget path={childPath} origin={center.offsetBy(childOffset)}/>
{/if}