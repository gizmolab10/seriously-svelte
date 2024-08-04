<script lang='ts'>
	import { k, s, u, Rect, Size, Point, Mouse_State, IDTool, ZIndex, onMount, signals, svgPaths, Direction, dbDispatch } from '../../ts/common/Global_Imports';
	import { ElementType, Element_State, Alteration_State, AlterationType, Svelte_Wrapper, transparentize } from '../../ts/common/Global_Imports';
	import { s_ancestry_editingTools, s_layout_asClusters } from '../../ts/state/Reactive_State';
	import { s_altering, s_graphRect, s_show_details } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Triangle_Button from '../mouse buttons/Triangle_Button.svelte';
	import Transparency_Circle from '../kit/Transparency_Circle.svelte';
	import Button from '../mouse buttons/Button.svelte';
	import Dot_Reveal from '../widget/Dot_Reveal.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Trash from '../kit/Trash.svelte';
	export let offset = Point.zero;
	const toolDiameter = k.dot_size * 1.4;
	const editingToolsRadius = k.editingTools_diameter / 2;
	const parentAlteringIDs = [IDTool.add_parent, IDTool.delete_parent];
	const needsMultipleVisibleParents = [IDTool.next, IDTool.delete_parent];
	const half_circleViewBox = `0 0 ${k.editingTools_diameter} ${k.editingTools_diameter}`;
	let elementStates_byID: { [id: string]: Element_State } = {};
	let isHovering_byID: { [id: string]: boolean } = {};
	let centers_byID: { [id: string]: Point } = {};
	let parentSensitiveColor = k.empty;
	let countOfVisibleParents = 0;
	let confirmingDelete = false;
	let graphRect = new Rect();
	let mouse_click_timer;
	let color = k.empty;
	let titleWidth = 0;
	let rebuilds = 0;
	let left = 64;
	let ancestry;
	let thing;
	function getC(id: string) { return centers_byID[id] ?? Point.zero; }
	function setC(id: string, center: Point) { return centers_byID[id] = center; }
	function alteration_forID(id: string) { return (id == IDTool.add_parent) ? AlterationType.adding : AlterationType.deleting; }

	onMount(() => { 
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

	function setupElementStates() {
		if (!!ancestry) {
			const ids = [IDTool.delete_cancel, IDTool.delete_confirm, IDTool.dismiss, IDTool.more];
			for (const id of ids) {
				const isDismiss = id == IDTool.dismiss;
				const element_state = s.elementState_for(ancestry, ElementType.tool, id);
				element_state.color_background = isDismiss ? k.color_background : 'transparent';
				element_state.set_forHovering(color, 'pointer');
				element_state.hoverIgnore = !isDismiss;
				elementStates_byID[id] = element_state;
			}		
		}
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
				setupElementStates();
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

	async function handle_mouse_data(mouse_state: Mouse_State, id: string) {
		if (mouse_state.isHover) {
			const element_state = elementStates_byID[id];
			const isOut = mouse_state.isOut;
			isHovering_byID[id] = !isOut;
			element_state.isOut = isOut;
		} else {
			switch (id) {
				case IDTool.delete_cancel: confirmingDelete = false; break;
				default:
					if (!isDisabledFor(id)) {
						await h.handle_tool_clicked(id, mouse_state);
					}
					break;
			}
			update_maybeRedraw();
		}
	}

	function update(): boolean {
		const rect = ancestry?.titleRect;
		if (rect && $s_ancestry_editingTools && rect.size.width != 0) {
			const offsetX = 16.3 + titleWidth - ($s_show_details ? k.width_details : 0) - ($s_layout_asClusters ? 38 : 0);
			const offsetY = (k.show_titleAtTop ? -45 : 0) + ($s_layout_asClusters ? 3 : 0) - k.editingTools_diameter - 6.5;
			const center = rect.centerLeft.offsetBy(offset).offsetByXY(offsetX, offsetY);
			const offsetReveal = Point.square(1);
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
			<Transparency_Circle
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
							z-index:{ZIndex.dots};'
						height={k.editingTools_diameter}
						width={k.editingTools_diameter}
						viewBox={half_circleViewBox}
						stroke='transparent'
						fill={thing.color}>
						<path d={svgPaths.half_circle(k.editingTools_diameter, Direction.up)}/>
					</svg>
				{/if}
				{#if isHovering_byID[IDTool.delete_cancel]}
					<svg class='delete-cancel' style='
							left:{getC(IDTool.confirmation).x}px;
							top:{getC(IDTool.confirmation).y}px;
							z-index:{ZIndex.dots};'
						height={k.editingTools_diameter}
						width={k.editingTools_diameter}
						viewBox={half_circleViewBox}
						stroke='transparent'
						fill={thing.color}>
						<path d={svgPaths.half_circle(k.editingTools_diameter, Direction.down)}/>
					</svg>
				{/if}
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, IDTool.delete_confirm)}
					element_state={elementStates_byID[IDTool.delete_confirm]}
					center={getC(IDTool.delete_confirm)}
					height={k.editingTools_diameter / 2}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={ZIndex.dots}
					color='transparent'
					border_thickness=0
					name='delete'>
					{#key isHovering_byID[IDTool.delete_confirm]}
						<div style='
							top: 11px;
							left: 13px;
							position: absolute;
							z-index: {ZIndex.frontmost};
							color: {isHovering_byID[IDTool.delete_confirm] ? 'white' : thing.color};'>
							delete
						</div>
					{/key}
				</Button>
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, IDTool.delete_cancel, )}
					element_state={elementStates_byID[IDTool.delete_cancel]}
					height={k.editingTools_diameter / 2}
					center={getC(IDTool.delete_cancel)}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={ZIndex.dots}
					color='transparent'
					border_thickness=0
					name='cancel'>
					{#key isHovering_byID[IDTool.delete_cancel]}
						<div style='
							top: 4px;
							left: 13px;
							position: absolute;
							z-index: {ZIndex.frontmost};
							color: {isHovering_byID[IDTool.delete_cancel] ? 'white' : thing.color};'>
							cancel
						</div>
					{/key}
				</Button>
				<div class='horizontal-line'
					style='
						left: {getC(IDTool.editingTools).x - editingToolsRadius}px;
						top: {getC(IDTool.editingTools).y + 0.5}px;
						width: {k.editingTools_diameter + 1}px;
						z-index: {ZIndex.tool_buttons};
						background-color: {color};
						position: absolute;
						height: 1px;'>
				</div>
			{:else}
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, IDTool.more)}
					color={isHovering_byID[IDTool.more] ? k.color_background : color}
					element_state={elementStates_byID[IDTool.more]}
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
				<Dot_Reveal name={elementStates_byID[IDTool.dismiss].name} hover_isReversed=true zindex={ZIndex.tool_buttons} ancestry={$s_ancestry_editingTools} center={getC(IDTool.dismiss)}/>
				<Triangle_Button
					strokeColor={isDisabledFor(IDTool.next) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.next, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, IDTool.next)}
					extraPath={svgPaths.circle_atOffset(toolDiameter, 4)}
					center={getC(IDTool.next)}
					angle={Direction.up}
					size={toolDiameter}
					name='next'/>
				<Triangle_Button
					strokeColor={isDisabledFor(IDTool.delete_parent) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.delete_parent, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, IDTool.delete_parent)}
					extraPath={svgPaths.dash(toolDiameter, 4)}
					center={getC(IDTool.delete_parent)}
					angle={Direction.left}
					name='delete_parent'
					size={toolDiameter}/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.add_parent, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, IDTool.add_parent)}
					strokeColor={isDisabledFor(IDTool.add_parent) ? k.color_disabled : color}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(IDTool.add_parent)}
					angle={Direction.left}
					size={toolDiameter}
					name='add_parent'/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(IDTool.create, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, IDTool.create)}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(IDTool.create)}
					angle={Direction.right}
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
						z-index: {ZIndex.dots};
						background: none;
						cursor: pointer;
						border: none;'>
					<Trash color={color} invert={isHovering_byID[IDTool.delete]}/>
				</button>
			{/if}
		</div>
	{/if}
{/key}
