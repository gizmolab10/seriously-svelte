<script lang='ts'>
	import { svgPaths, Direction, dbDispatch, transparentize, AlterationState, Alteration } from '../../ts/common/GlobalImports';
	import { k, u, Rect, Size, Point, IDTool, ZIndex, onMount, Wrapper, signals } from '../../ts/common/GlobalImports';
	import { s_path_editingTools, s_layout_asClusters } from '../../ts/state/State';
	import { s_altering, s_graphRect, s_show_details } from '../../ts/state/State';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import CircularButton from '../buttons/CircularButton.svelte';
	import TriangleButton from '../buttons/TriangleButton.svelte';
	import DotReveal from '../widget/DotReveal.svelte';
	import Button from '../buttons/Button.svelte';
	import Trash from '../buttons/Trash.svelte';
	import { h } from '../../ts/db/DBDispatch';
	export let offset = Point.zero;
	const editingToolsDiameter = k.editingTools_diameter;
	const half_circleViewBox = `0 0 ${editingToolsDiameter} ${editingToolsDiameter}`;
	const needsMultipleVisibleParents = [IDTool.next, IDTool.delete_parent];
	const parentAlteringIDs = [IDTool.add_parent, IDTool.delete_parent];
	const editingToolsRadius = editingToolsDiameter / 2;
	const toolDiameter = k.dot_size * 1.4;
	let hovers: { [type: string]: boolean } = {}
	let centers: { [type: string]: Point } = {}
	let parentSensitiveColor = k.empty;
	let countOfVisibleParents = 0;
	let confirmingDelete = false;
	let graphRect = new Rect();
	let color = k.empty;
	let titleWidth = 0;
	let rebuilds = 0;
	let clickTimer;
	let left = 64;
	let thing;
	let path;

	function handle_mouseUp() { clearTimeout(clickTimer); }
	function getC(type: string) { return centers[type] ?? new Point(); }
	function setC(type: string, center: Point) { return centers[type] = center; }
	function centers_isEmpty(): boolean { return Object.keys(centers).length == 0; }
	function alteration_for(idTool: string) { return (idTool == IDTool.add_parent) ? Alteration.adding : Alteration.deleting; }

	onMount(() => { 
		setup();
		setTimeout(() => { updateMaybeRedraw(); }, 20);	
		const handler = signals.handle_relayoutWidgets((path) => {
			setTimeout(() => {
				update();
				rebuilds += 1;
			}, 1);	  // wait for graph to relayout
		});
		return () => { handler.disconnect() };
	});

	function isInvertedFor(idTool: string) {
		return parentAlteringIDs.includes(idTool) && $s_altering?.alteration == alteration_for(idTool);
	}

	function isDisabledFor(id: string) {
		return ((path.isFocus || thing.isBulkAlias) && (id == IDTool.add_parent)) ||
		((countOfVisibleParents < 2) && needsMultipleVisibleParents.includes(id));
	}

	function setup() {
		path = $s_path_editingTools;
		thing = path?.thing;
	}

	function updateMaybeRedraw() {
		if (update()) {
			rebuilds += 1;
		}
	}

	$: {
		if (graphRect != $s_graphRect) {
			graphRect = $s_graphRect;
			updateMaybeRedraw();
		}
	}

	$: {
		if (!path || (!$s_path_editingTools?.matchesPath(path) ?? false)) {
			path = $s_path_editingTools;
			if (!!path) {
				thing = path.thing;
				color = thing?.color ?? k.empty;
				titleWidth = thing?.titleWidth ?? 0;
				const hasOneParent = (thing?.parents.length ?? 0) == 1;
				countOfVisibleParents = path.visibleParentPaths(0).length;
				parentSensitiveColor = (hasOneParent || path.isFocus) ? k.color_disabled : color ;
				update();
				rebuilds += 1;
			}
		}
	}

	function fillColorsFor(id: string, isFilled: boolean): [string, string] {
		const isDisabled = isDisabledFor(id);
		const nextIsDisabled = isDisabled && needsMultipleVisibleParents.includes(id);
		if (isDisabled || (isFilled == isInvertedFor(id))) {
			const extraColor = nextIsDisabled ? k.color_disabled : isDisabled || isFilled ? parentSensitiveColor : color;
			return [k.color_background, extraColor];
		}
		return [color, k.color_background];
	}

	async function handle_click(id: string, event: MouseEvent, isLong: boolean) {
		switch (id) {
			case IDTool.delete: confirmingDelete = true; break;
			case IDTool.delete_cancel: confirmingDelete = false; break;
			default:
				if (!!path && !path.isExemplar && !isDisabledFor(id)) {
					await h.handle_tool_clicked(id, event, isLong);
				}
				break;
		}
		updateMaybeRedraw();
	}

	function update(): boolean {
		const rect = path?.titleRect;
		if (rect && $s_path_editingTools && rect.size.width != 0) {
			const offsetX = 8.5 + titleWidth - ($s_show_details ? k.width_details : 0) - ($s_layout_asClusters ? 38 : 0);
			const offsetY = (k.titleIsAtTop ? -45 : 0) + ($s_layout_asClusters ? 3 : 0) - editingToolsDiameter - 5.8;
			const center = rect.centerLeft.offsetBy(offset).offsetBy(new Point(offsetX, offsetY));
			const offsetReveal = new Point(-5.3, -5.5);
			const x = center.x;
			const y = center.y;
			left = x - toolDiameter;
			setC(IDTool.editingTools,   center);
			setC(IDTool.dismiss,		center.offsetBy(offsetReveal));
			setC(IDTool.confirmation,   center.offsetEquallyBy(1 - editingToolsRadius));
			setC(IDTool.delete_cancel,  center.offsetBy(new Point(1 - toolDiameter, toolDiameter - 5)));
			setC(IDTool.delete_confirm, center.offsetBy(new Point(2 - toolDiameter, 5 - toolDiameter)));
			setC(IDTool.create,		 	new Point(x + toolDiameter - 3, y - toolDiameter + 7));
			setC(IDTool.more,			new Point(x + 0.9, y + toolDiameter + 3.5));
			setC(IDTool.delete_parent,  new Point(left - 1, y + toolDiameter - 8));
			setC(IDTool.add_parent,	 	new Point(left - 1, y - toolDiameter + 7));
			setC(IDTool.next,			new Point(x - 2, y - toolDiameter - 2));
			setC(IDTool.delete,		 	new Point(x + 4.5, y + 3));
			return true;
		}
		return false;
	}

</script>

<style>
	svg {
		top:0px;
		left:0px;
		position: absolute;
	}
	button {
		border-width: 1px;
		position: absolute;
		border-radius: 17px;
	}
	@keyframes colorFade {
		0%, 100% { color: black; }
		50% { color: lightgray; }
	}
</style>

{#key rebuilds}
	{#if $s_path_editingTools?.isVisible || false}
		<div class='editing-tools' style='
			position:absolute;
			z-index: {ZIndex.frontmost}'>
			<TransparencyCircle
				thickness=1
				opacity=0.15
				color={color}
				zindex={ZIndex.dots}
				radius={editingToolsRadius}
				center={getC(IDTool.editingTools)}
				color_background={transparentize(k.color_background, 0.05)}/>
			{#if confirmingDelete}
				{#if hovers[IDTool.delete_confirm]}
					<svg class='delete-confirm' style='
							left:{getC(IDTool.confirmation).x}px;
							top:{getC(IDTool.confirmation).y}px;
							z-index:{ZIndex.tools};'
						viewBox={half_circleViewBox}
						height={editingToolsDiameter}
						width={editingToolsDiameter}
						stroke=transparent
						fill={color}>
						<path d={svgPaths.half_circle(editingToolsDiameter, Direction.up)}/>
					</svg>
				{/if}
				{#if hovers[IDTool.delete_cancel]}
					<svg class='delete-cancel' style='
							left:{getC(IDTool.confirmation).x}px;
							top:{getC(IDTool.confirmation).y}px;
							z-index:{ZIndex.tools};'
						height={editingToolsDiameter}
						viewBox={half_circleViewBox}
						width={editingToolsDiameter}
						fill={color}>
						<path d={svgPaths.half_circle(editingToolsDiameter, Direction.down)}/>
					</svg>
				{/if}
				<Button
					click_closure={(event, isLong) => handle_click(IDTool.delete_confirm, event, isLong)}
					hover_closure={(isHovering) => { hovers[IDTool.delete_confirm] = isHovering; }}
					color={ hovers[IDTool.delete_confirm] ? k.color_background : color}
					center={getC(IDTool.delete_confirm)}>
					delete
				</Button>
				<Button
					click_closure={(event, isLong) => handle_click(IDTool.delete_cancel, event, isLong)}
					hover_closure={(isHovering) => { hovers[IDTool.delete_cancel] = isHovering; }}
					color={ hovers[IDTool.delete_cancel] ? k.color_background : color}
					center={getC(IDTool.delete_cancel)}>
					cancel
				</Button>
				<div class='horizontal-line'
					style='
						left: {getC(IDTool.editingTools).x - editingToolsRadius}px;
						top: {getC(IDTool.editingTools).y + 0.5}px;
						width: {editingToolsDiameter + 1}px;
						z-index: {ZIndex.frontmost};
						background-color: {color};
						position: absolute;
						height: 1px;'>
				</div>
			{:else}
			<Button
				click_closure={(event, isLong) => handle_click(IDTool.more, event, isLong)}
				hover_closure={(isHovering) => { hovers[IDTool.more] = isHovering; }}
				center={getC(IDTool.more)}
				color={color}
				height=16
				width=18>
				<svg width=18
					fill={hovers[IDTool.more] ? color : 'transparent'}
					viewBox='0 1 18 16'
					stroke={color}
					height=16>
					<path d={svgPaths.oval(18, true)}/>
				</svg>
				<svg 
					fill={hovers[IDTool.more] ? k.color_background : color}
					viewBox='-0.5 -2 14 10'
					height=10
					width=16>
					<path d={svgPaths.ellipses(7, 1)}/>
				</svg>
			</Button>
			<DotReveal path={$s_path_editingTools} center={getC(IDTool.dismiss)}/>
			<TriangleButton
				strokeColor={isDisabledFor(IDTool.next) ? k.color_disabled : parentSensitiveColor}
				hover_closure={(isFilled) => { return fillColorsFor(IDTool.next, isFilled) }}
				click_closure={(event, isLong) => handle_click(IDTool.next, event, isLong)}
				cursor={isDisabledFor(IDTool.next) ? 'normal' : 'pointer'}
				extraPath={svgPaths.circle(toolDiameter, 4)}
				center={getC(IDTool.next)}
				direction={Direction.up}
				size={toolDiameter}
				id='next'/>
			<TriangleButton
				strokeColor={isDisabledFor(IDTool.delete_parent) ? k.color_disabled : parentSensitiveColor}
				hover_closure={(isFilled) => { return fillColorsFor(IDTool.delete_parent, isFilled) }}
				click_closure={(event, isLong) => handle_click(IDTool.delete_parent, event, isLong)}
				cursor={isDisabledFor(IDTool.delete_parent) ? 'normal' : 'pointer'}
				extraPath={svgPaths.dash(toolDiameter, 4)}
				center={getC(IDTool.delete_parent)}
				direction={Direction.left}
				id='delete_parent'
				size={toolDiameter}/>
			<TriangleButton
				hover_closure={(isFilled) => { return fillColorsFor(IDTool.add_parent, isFilled) }}
				click_closure={(event, isLong) => handle_click(IDTool.add_parent, event, isLong)}
				strokeColor={isDisabledFor(IDTool.add_parent) ? k.color_disabled : color}
				cursor={isDisabledFor(IDTool.add_parent) ? 'normal' : 'pointer'}
				extraPath={svgPaths.t_cross(toolDiameter, 3)}
				center={getC(IDTool.add_parent)}
				direction={Direction.left}
				id='add_parent'
				size={toolDiameter}/>
			<TriangleButton
				hover_closure={(isFilled) => { return fillColorsFor(IDTool.create, isFilled) }}
				click_closure={(event, isLong) => handle_click(IDTool.create, event, isLong)}
				extraPath={svgPaths.t_cross(toolDiameter, 3)}
				center={getC(IDTool.create)}
				direction={Direction.right}
				strokeColor={color}
				size={toolDiameter}
				id='add'/>
			<button id='delete'
				on:blur={u.ignore}
				on:focus={u.ignore}
				on:mouseout={() => { hovers[IDTool.delete] = false; }}
				on:mouseover={() => { hovers[IDTool.delete] = true; }}
				on:click={(event) => handle_click(IDTool.delete, event, false)}
				style='
					left: {getC(IDTool.delete).x}px;
					top: {getC(IDTool.delete).y}px;
					z-index: {ZIndex.tools};
					background: none;
					cursor: pointer;
					border: none;'>
				<Trash color={color} invert={hovers[IDTool.delete]}/>
			</button>
			{/if}
		</div>
	{/if}
{/key}
