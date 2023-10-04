<script lang=ts>
	import { noop, Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, lineStretch } from '../../ts/managers/State';
	import Children from './Children.svelte';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;

	const widgetOffset = new Point(10, -14);	// TODO: WHY is this needed, where does this value come from?
	let lineRects: Array<LineRect> = [];
	let toggleDraw = false;
	let children = thing.children;

	onMount( () => { layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }
	
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		setTimeout(() => { // delay until all other handlers for this signal are done
			const newChildren = thing.children;
			if (idThing == thing.id || children != newChildren) {
				normalizeOrderOf(newChildren);
				children = newChildren;
				layoutChildren();
				toggleDraw = !toggleDraw;
			}
		}, 1);
	})

	function layoutChildren() {
		if (thing) {
			const height = (thing.halfVisibleProgenyHeight) - 4;	// TODO: why 4?
			const childOrigin = origin.offsetByY(height);
			lineRects = new Layout(thing, childOrigin).lineRects;
		}
	}

	function originForChild(child: Thing, index: number): Point {
		if (child.title == 'Al is my voodoo dood') {
			noop();
		}
		const rect = lineRectAt(index);
		const offsetX = child.titleWidth + $lineStretch + 9;
		const y = rect.extent.y - child.halfVisibleProgenyHeight + 4;
		return new Point(origin.x + offsetX, y);
	}
	
	function description() {
		let strings: Array<string> = [];
		for (const lineRect of lineRects) {
			strings.push(lineRect.origin.verbose);
			strings.push(lineRect.extent.verbose);
			strings.push(lineRect.size.verbose);
		}
		return strings.join(', ');
	}

</script>

{#key toggleDraw}
	{#if children && children.length != 0 && lineRects.length == children.length}
		{#each children as child, index}
			<Widget thing={child} origin={lineRectAt(index).extent.offsetBy(widgetOffset)}/>
			<Line color={child.color} curveType={curveTypeAt(index)} rect={lineRectAt(index)}/>
			{#if child.hasChildren && child.isExpanded}
				<Children thing={child} origin={originForChild(child, index)}/>
			{/if}
		{/each}
	{/if}
{/key}
