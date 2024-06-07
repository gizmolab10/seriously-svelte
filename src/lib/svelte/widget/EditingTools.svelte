<script lang='ts'>
	import { k, s, u, Rect, Size, Point, MouseState, IDTool, ZIndex, onMount, signals,  svgPaths, Direction } from '../../ts/common/GlobalImports';
	import {dbDispatch, SvelteWrapper, ButtonState, AlterationState, AlterationType, transparentize } from '../../ts/common/GlobalImports';
	import { s_ancestry_editingTools, s_layout_asClusters } from '../../ts/state/ReactiveState';
	import { s_altering, s_graphRect, s_show_details } from '../../ts/state/ReactiveState';
	import TransparencyCircle from '../kit/TransparencyCircle.svelte';
	import TriangleButton from '../mouse buttons/TriangleButton.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import DotReveal from '../widget/DotReveal.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Trash from '../kit/Trash.svelte';
	export let offset = Point.zero;
	const editingToolsDiameter = k.editingTools_diameter;
	const half_circleViewBox = `0 0 ${editingToolsDiameter} ${editingToolsDiameter}`;
	const needsMultipleVisibleParents = [IDTool.next, IDTool.delete_parent];
	const parentAlteringIDs = [IDTool.add_parent, IDTool.delete_parent];
	const editingToolsRadius = editingToolsDiameter / 2;
	const toolDiameter = k.dot_size * 1.4;
	let isHovering_byID: { [id: string]: boolean } = {}
	let centers_byID: { [id: string]: Point } = {}
	let parentSensitiveColor = k.empty;
	let countOfVisibleParents = 0;
	let confirmingDelete = false;
	let graphRect = new Rect();
	let mouse_click_timer;
	let color = k.empty;
	let titleWidth = 0;
	let rebuilds = 0;
	let left = 64;
	let thing;
	let ancestry;

	function getC(id: string) { return centers_byID[id] ?? Point.zero; }
	function setC(id: string, center: Point) { return centers_byID[id] = center; }
	function alteration_forID(id: string) { return (id == IDTool.add_parent) ? AlterationType.adding : AlterationType.deleting; }

	onMount(() => { 
		setup();
		setTimeout(() => { update_maybeRedraw(); }, 20);	
		const handler = signals.handle_relayoutWidgets(2, (ancestry) => {	// priority of 2 assures layout is finished
			update();
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	function isInvertedFor(id: string) {
		return parentAlteringIDs.includes(id) && $s_altering?.alteration == alteration_forID(id);
	}

	function isDisabledFor(id: string) {
		return ((ancestry.isFocus || thing.isBulkAlias) && (id == IDTool.add_parent)) ||
		((countOfVisibleParents < 2) && needsMultipleVisibleParents.includes(id));
	}

	function setup() {
		ancestry = $s_ancestry_editingTools;
		thing = ancestry?.thing;
	}

	function update_maybeRedraw(force: boolean = false) {
		if (update() || force) {
			rebuilds += 1;
		}
	}

	$: {
		if (graphRect != $s_graphRect) {
			graphRect = $s_graphRect;
			update_maybeRedraw();
		}
	}

	$: {
		if (!ancestry || (!$s_ancestry_editingTools?.matchesAncestry(ancestry) ?? false)) {
			ancestry = $s_ancestry_editingTools;
			if (!!ancestry) {
				thing = ancestry.thing;
				color = thing?.color ?? k.empty;
				titleWidth = thing?.titleWidth ?? 0;
				const hasOneParent = (thing?.parents.length ?? 0) == 1;
				countOfVisibleParents = ancestry.visibleParentAncestries(0).length;
				parentSensitiveColor = (hasOneParent || ancestry.isFocus) ? k.color_disabled : color ;
				update_maybeRedraw(true);
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

	async function handle_delete_event(event) {
		if (!isDisabledFor(IDTool.delete)) {
			confirmingDelete = true;
		}
	}

	async function handle_mouse_data(mouseState: MouseState, id: string) {
		if (mouseState.isHover) {
			const isOut = mouseState.isOut;
			isHovering_byID[id] = !isOut;
			s.buttonState_forName(id).update(isOut, color, 'pointer');
		} else {
			switch (id) {
				case IDTool.delete_cancel: confirmingDelete = false; break;
				default:
					if (!isDisabledFor(id)) {
						await h.handle_tool_clicked(id, mouseState);
					}
					break;
			}
			update_maybeRedraw();
		}
	}

	function update(): boolean {
		const rect = ancestry?.titleRect;
		if (rect && $s_ancestry_editingTools && rect.size.width != 0) {
			const offsetX = 8.5 + titleWidth - ($s_show_details ? k.width_details : 0) - ($s_layout_asClusters ? 38 : 0);
			const offsetY = (k.show_titleAtTop ? -45 : 0) + ($s_layout_asClusters ? 3 : 0) - editingToolsDiameter - 5.8;
			const center = rect.centerLeft.offsetBy(offset).offsetByXY(offsetX, offsetY);
			const offsetReveal = Point.square(-5.5);
			const x = center.x;
			const y = center.y;
			left = x - toolDiameter;
			setC(IDTool.editingTools,   center);
			setC(IDTool.dismiss,		center.offsetBy(offsetReveal));
			setC(IDTool.confirmation,   center.offsetEquallyBy(1 - editingToolsRadius));
			setC(IDTool.delete_cancel,  center.offsetByXY(19 - toolDiameter, -1 + toolDiameter));
			setC(IDTool.delete_confirm, center.offsetByXY(20 - toolDiameter, 3 - toolDiameter));
			setC(IDTool.create,		 	center.offsetByXY(1 + toolDiameter, 8 - toolDiameter));
			setC(IDTool.delete_parent,  center.offsetByXY(2 - toolDiameter, toolDiameter - 5));
			setC(IDTool.add_parent,	 	center.offsetByXY(2 - toolDiameter, 8 - toolDiameter));
			setC(IDTool.more,			center.offsetByXY(0.9, toolDiameter + 3.5));
			setC(IDTool.next,			center.offsetByXY(2, -toolDiameter - 2));
			setC(IDTool.delete,		 	center.offsetByXY(5.5, 3));
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
	{#if $s_ancestry_editingTools?.isVisible || false}
		<div class='editing-tools' style='
			position:absolute;
			z-index: {ZIndex.tools}'>
			<TransparencyCircle
				thickness=1
				opacity=0.15
				color={color}
				zindex={ZIndex.dots}
				radius={editingToolsRadius}
				center={getC(IDTool.editingTools)}
				color_background={transparentize(k.color_background, 0.05)}/>
			{#if confirmingDelete}
				{#if isHovering_byID[IDTool.delete_confirm]}
					<svg class='delete-confirm' style='
							left:{getC(IDTool.confirmation).x}px;
							top:{getC(IDTool.confirmation).y}px;
							z-index:{ZIndex.tool_buttons};'
						height={editingToolsDiameter}
						width={editingToolsDiameter}
						viewBox={half_circleViewBox}
						stroke=transparent
						fill={color}>
						<path d={svgPaths.half_circle(editingToolsDiameter, Direction.up)}/>
					</svg>
				{/if}
				{#if isHovering_byID[IDTool.delete_cancel]}
					<svg class='delete-cancel' style='
							left:{getC(IDTool.confirmation).x}px;
							top:{getC(IDTool.confirmation).y}px;
							z-index:{ZIndex.tool_buttons};'
						height={editingToolsDiameter}
						viewBox={half_circleViewBox}
						width={editingToolsDiameter}
						fill={color}>
						<path d={svgPaths.half_circle(editingToolsDiameter, Direction.down)}/>
					</svg>
				{/if}
				<Button
					closure={(mouseState) => handle_mouse_data(mouseState, IDTool.delete_confirm)}
					color={isHovering_byID[IDTool.delete_confirm] ? k.color_background : color}
					center={getC(IDTool.delete_confirm)}
					height={editingToolsDiameter / 2}
					width={editingToolsDiameter}
					zindex={ZIndex.frontmost}
					name='delete'>
					<div style='
						top: 11px;
						left: 13px;
						position: absolute;'>
						delete
					</div>
				</Button>
				<Button
					closure={(mouseState) => handle_mouse_data(mouseState, IDTool.delete_cancel)}
					color={isHovering_byID[IDTool.delete_cancel] ? k.color_background : color}
					center={getC(IDTool.delete_cancel)}
					height={editingToolsDiameter / 2}
					width={editingToolsDiameter}
					zindex={ZIndex.frontmost}
					name='cancel'>
					<div style='
						top: 4px;
						left: 13px;
						position: absolute;'>
						cancel
					</div>
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
					closure={(mouseState) => handle_mouse_data(mouseState, IDTool.more)}
					color={isHovering_byID[IDTool.more] ? k.color_background : color}
					height={k.default_buttonSize}
					zindex={ZIndex.tool_buttons}
					center={getC(IDTool.more)}
					border_thickness=0
					name='more'
					width=18>
					<svg width=18
						stroke={color}
						viewBox='0 1 18 16'
						height={k.default_buttonSize}
						fill={isHovering_byID[IDTool.more] ? color : 'transparent'}>
						<path d={svgPaths.oval(18, true)}/>
					</svg>
					<svg height=10
						viewBox='-0.5 -2 14 10'
						width={k.default_buttonSize}
						fill={isHovering_byID[IDTool.more] ? k.color_background : color}>
						<path d={svgPaths.ellipses(7, 1)}/>
					</svg>
				</Button>
				<DotReveal ancestry={$s_ancestry_editingTools} center={getC(IDTool.dismiss)}/>
				<TriangleButton
					strokeColor={isDisabledFor(IDTool.next) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.next, isHovering) }}
					mouse_closure={(mouseState) => handle_mouse_data(mouseState, IDTool.next)}
					extraPath={svgPaths.circle_atOffset(toolDiameter, 4)}
					center={getC(IDTool.next)}
					direction={Direction.up}
					size={toolDiameter}
					name='next'/>
				<TriangleButton
					strokeColor={isDisabledFor(IDTool.delete_parent) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.delete_parent, isHovering) }}
					mouse_closure={(mouseState) => handle_mouse_data(mouseState, IDTool.delete_parent)}
					extraPath={svgPaths.dash(toolDiameter, 4)}
					center={getC(IDTool.delete_parent)}
					direction={Direction.left}
					name='delete_parent'
					size={toolDiameter}/>
				<TriangleButton
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.add_parent, isHovering) }}
					mouse_closure={(mouseState) => handle_mouse_data(mouseState, IDTool.add_parent)}
					strokeColor={isDisabledFor(IDTool.add_parent) ? k.color_disabled : color}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(IDTool.add_parent)}
					direction={Direction.left}
					size={toolDiameter}
					name='add_parent'/>
				<TriangleButton
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.create, isHovering) }}
					mouse_closure={(mouseState) => handle_mouse_data(mouseState, IDTool.create)}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(IDTool.create)}
					direction={Direction.right}
					strokeColor={color}
					size={toolDiameter}
					name='add'/>
				<button id='delete'
					on:blur={u.ignore}
					on:focus={u.ignore}
					on:mouseout={() => { isHovering_byID[IDTool.delete] = false; }}
					on:mouseover={() => { isHovering_byID[IDTool.delete] = true; }}
					on:click={(event) => handle_delete_event(event)}
					style='
						left: {getC(IDTool.delete).x}px;
						top: {getC(IDTool.delete).y}px;
						z-index: {ZIndex.tools};
						background: none;
						cursor: pointer;
						border: none;'>
					<Trash color={color} invert={isHovering_byID[IDTool.delete]}/>
				</button>
			{/if}
		</div>
	{/if}
{/key}
