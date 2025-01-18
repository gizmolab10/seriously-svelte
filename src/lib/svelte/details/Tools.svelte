<script lang='ts'>
	import { g, k, u, ux, w, show, Rect, Size, Point, debug, T_Tool, ZIndex } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_hierarchy, s_graph_type, s_show_details } from '../../ts/state/Svelte_Stores';
	import { dbDispatch, T_Element, Mouse_State, Element_State } from '../../ts/common/Global_Imports';
	import { Alteration_State, T_Alteration, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { s_alteration_mode, s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import { svgPaths, signals, Direction, T_Graph } from '../../ts/common/Global_Imports';
	import Transparent_Circle from '../kit/Transparent_Circle.svelte';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Triangle_Button from '../mouse/Triangle_Button.svelte';
	import Dot_Reveal from '../widget/Dot_Reveal.svelte';
	import Button from '../mouse/Button.svelte';
	import Trash from '../kit/Trash.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const toolDiameter = k.dot_size * 1.4;
	const editingToolsRadius = k.editingTools_diameter / 2;
	const parentAlteringIDs = [T_Tool.add_parent, T_Tool.delete_parent];
	const needsMultipleVisibleParents = [T_Tool.next, T_Tool.delete_parent];
	const half_circleViewBox = `0 0 ${k.editingTools_diameter} ${k.editingTools_diameter}`;
	let element_states_byID: { [id: string]: Element_State } = {};
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
	function alteration_forID(id: string) { return (id == T_Tool.add_parent) ? T_Alteration.adding : T_Alteration.deleting; }

	debug.log_tools('mount tools')
	setTimeout(() => { layout_tools_forceRedraw(); }, 20);

	onMount(() => {
		const handler = signals.handle_relayoutWidgets(2, (ancestry) => {	// priority of 2 assures layout is finished
			layout_tools_forceRedraw(true);
		});
		return () => { handler.disconnect() };
	});

	function isInvertedFor(id: string) {
		return parentAlteringIDs.includes(id) && $s_alteration_mode?.type == alteration_forID(id);
	}

	function isDisabledFor(id: string) {
		return ((ancestry.isFocus || thing.isBulkAlias) && (id == T_Tool.add_parent)) ||
		((countOfVisibleParents < 2) && needsMultipleVisibleParents.includes(id));
	}

	function reset_all_element_states_for_ancestry_change() {
		if (!!ancestry) {
			debug.log_tools('element states')
			const ids = [T_Tool.delete_cancel, T_Tool.add_parent, T_Tool.delete_parent, T_Tool.delete_cancel, T_Tool.delete_confirm, T_Tool.dismiss, T_Tool.create, T_Tool.next, T_Tool.more];
			for (const id of ids) {
				const isDismiss = (id == T_Tool.dismiss);
				const element_state = ux.element_state_for(ancestry, T_Element.tool, id);
				element_state.color_background = isDismiss ? k.color_background : 'transparent';
				element_state.set_forHovering(color, 'pointer');
				element_state.hoverIgnore = !isDismiss;
				element_states_byID[id] = element_state;
			}		
		}
	}

	$: {
		if (graphRect != $s_graphRect) {
			graphRect = $s_graphRect;
			layout_tools_forceRedraw();
		}
	}

	$: {
		if (!ancestry || !ancestry.ancestry_hasEqualID($s_ancestry_showing_tools)) {
			ancestry = $s_ancestry_showing_tools;
			if (!!ancestry) {
				thing = ancestry.thing;
				color = thing?.color ?? k.empty;
				titleWidth = thing?.titleWidth ?? 0;
				const hasOneParent = (thing?.parents.length ?? 0) == 1;
				countOfVisibleParents = ancestry.visibleParentAncestries(0).length;
				parentSensitiveColor = (hasOneParent || ancestry.isFocus) ? k.color_disabled : color ;
				reset_all_element_states_for_ancestry_change();
				layout_tools_forceRedraw(true);
			}
		}
	}

	async function handle_delete_event(event) {
		if (!isDisabledFor(T_Tool.delete)) {
			confirmingDelete = true;
		}
	}

	function titleOffsetX(): number {
		if (!!ancestry) {
			const shows_Reveal = ancestry.showsReveal;
			const forward = ancestry.widget_map?.points_right ?? true;
			return g.inRadialMode ? forward ? titleWidth + 23 : -6 : shows_Reveal ? titleWidth + 25 : titleWidth + 17;
		}
		return 0;
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

	async function handle_mouse_data(mouse_state: Mouse_State, id: string) {
		if (mouse_state.isHover) {
			const element_state = element_states_byID[id];
			const isOut = mouse_state.isOut;
			isHovering_byID[id] = !isOut;
			element_state.isOut = isOut;
		} else if (mouse_state.isUp || mouse_state.isLong) {
			switch (id) {
				case T_Tool.delete_cancel: confirmingDelete = false; break;
				default:
					if (!isDisabledFor(id)) {
						await $s_hierarchy.handle_tool_clicked(id, mouse_state);
					}
					break;
			}
			layout_tools_forceRedraw();
		}
	}

	function layout_tools_forceRedraw(force: boolean = false) {
		let rect = ancestry?.titleRect?.atZero;
		if (!!rect && rect.size.width != 0) {
			debug.log_origins(`setC all tools ${rect.description}`);
			const center = rect.centerLeft.offsetByXY(titleOffsetX(), (1 - w.scale_factor) * 9);
			left = center.x - toolDiameter;
			setC(T_Tool.confirmation,   center.offsetEquallyBy(1 - editingToolsRadius));
			setC(T_Tool.delete_parent,  center.offsetByXY(2 - toolDiameter, toolDiameter - 5));
			setC(T_Tool.delete_cancel,  center.offsetByXY(19 - toolDiameter, toolDiameter - 1));
			setC(T_Tool.delete_confirm, center.offsetByXY(20 - toolDiameter, 3 - toolDiameter));
			setC(T_Tool.create,		 	center.offsetByXY(1 + toolDiameter, 8 - toolDiameter));
			setC(T_Tool.add_parent,	 	center.offsetByXY(2 - toolDiameter, 8 - toolDiameter));
			setC(T_Tool.more,			center.offsetByXY(0.9, toolDiameter + 3.5));
			setC(T_Tool.next,			center.offsetByXY(2, -toolDiameter - 2));
			setC(T_Tool.delete,		 	center.offsetByXY(5.5, 3));
			setC(T_Tool.dismiss,		center.offsetByXY(1, 1));
			setC(T_Tool.editingTools,   center);
			rebuilds += 1;
		} else if (force) {
			rebuilds += 1;
		}
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
	{#if !!$s_ancestry_showing_tools}
		<div class='editing-tools' style='
			position:absolute;
			z-index: {ZIndex.tools}'>
			<Transparent_Circle
				color_background={u.opacitize(k.color_background, 0.95)}
				center={getC(T_Tool.editingTools)}
				radius={editingToolsRadius}
				zindex={ZIndex.dots}
				color={color}
				opacity=0.85
				thickness=1/>
			{#if confirmingDelete}
				{#if isHovering_byID[T_Tool.delete_confirm]}
					<svg class='delete-confirm' style='
							left:{getC(T_Tool.confirmation).x}px;
							top:{getC(T_Tool.confirmation).y}px;
							z-index:{ZIndex.dots};'
						height={k.editingTools_diameter}
						width={k.editingTools_diameter}
						viewBox={half_circleViewBox}
						stroke='transparent'
						fill={thing.color}>
						<path class='delete-confirm-path' d={svgPaths.half_circle(k.editingTools_diameter, Direction.up)}/>
					</svg>
				{/if}
				{#if isHovering_byID[T_Tool.delete_cancel]}
					<svg class='delete-cancel' style='
							left:{getC(T_Tool.confirmation).x}px;
							top:{getC(T_Tool.confirmation).y}px;
							z-index:{ZIndex.dots};'
						height={k.editingTools_diameter}
						width={k.editingTools_diameter}
						viewBox={half_circleViewBox}
						stroke='transparent'
						fill={thing.color}>
						<path class='delete-cancel-path' d={svgPaths.half_circle(k.editingTools_diameter, Direction.down)}/>
					</svg>
				{/if}
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.delete_confirm)}
					element_state={element_states_byID[T_Tool.delete_confirm]}
					center={getC(T_Tool.delete_confirm)}
					height={k.editingTools_diameter / 2}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={ZIndex.dots}
					color='transparent'
					border_thickness=0
					name='delete'>
					{#key isHovering_byID[T_Tool.delete_confirm]}
						<div style='
							color: {isHovering_byID[T_Tool.delete_confirm] ? 'white' : thing.color};
							z-index: {ZIndex.frontmost};
							position: absolute;
							left: 13px;
							top: 11px;'>
							delete
						</div>
					{/key}
				</Button>
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.delete_cancel, )}
					element_state={element_states_byID[T_Tool.delete_cancel]}
					height={k.editingTools_diameter / 2}
					center={getC(T_Tool.delete_cancel)}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={ZIndex.dots}
					color='transparent'
					border_thickness=0
					name='cancel'>
					{#key isHovering_byID[T_Tool.delete_cancel]}
						<div style='
							top: 4px;
							left: 13px;
							position: absolute;
							z-index: {ZIndex.frontmost};
							color: {isHovering_byID[T_Tool.delete_cancel] ? 'white' : thing.color};'>
							cancel
						</div>
					{/key}
				</Button>
				<div class='horizontal-line'
					style='
						left: {getC(T_Tool.editingTools).x - editingToolsRadius}px;
						top: {getC(T_Tool.editingTools).y + 0.5}px;
						width: {k.editingTools_diameter + 1}px;
						z-index: {ZIndex.tool_buttons};
						background-color: {color};
						position: absolute;
						height: 1px;'>
				</div>
			{:else}
				<Button
					closure={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.more)}
					element_state={element_states_byID[T_Tool.more]}
					height={k.default_buttonSize}
					zindex={ZIndex.tool_buttons}
					center={getC(T_Tool.more)}
					color='transparent'
					border_thickness=0
					name='more'
					width=18>
					<svg width=18
						stroke={color}
						class='more-svg' 
						viewBox='0 1 18 16'
						height={k.default_buttonSize}
						fill={isHovering_byID[T_Tool.more] ? color : 'transparent'}>
						<path class='more-path' d={svgPaths.oval(18, true)}/>
					</svg>
					<svg height=10
						class='ellipses-svg' 
						viewBox='-0.5 -2 14 10'
						width={k.default_buttonSize}
						fill={isHovering_byID[T_Tool.more] ? k.color_background : color}>
						<path class='ellipses-path' d={svgPaths.ellipses(7, 1)}/>
					</svg>
				</Button>
				<Dot_Reveal
					name={element_states_byID[T_Tool.dismiss].name}
					ancestry={$s_ancestry_showing_tools}
					center={getC(T_Tool.dismiss)}
					zindex={ZIndex.tool_buttons}
					hover_isReversed=true/>
				<Triangle_Button
					strokeColor={isDisabledFor(T_Tool.next) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.next, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.next)}
					extraPath={svgPaths.circle_atOffset(toolDiameter, 4)}
					center={getC(T_Tool.next)}
					angle={Direction.up}
					size={toolDiameter}
					name='next'/>
				<Triangle_Button
					strokeColor={isDisabledFor(T_Tool.delete_parent) ? k.color_disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.delete_parent, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.delete_parent)}
					extraPath={svgPaths.dash(toolDiameter, 4)}
					center={getC(T_Tool.delete_parent)}
					angle={Direction.left}
					name='delete_parent'
					size={toolDiameter}/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.add_parent, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.add_parent)}
					strokeColor={isDisabledFor(T_Tool.add_parent) ? k.color_disabled : color}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(T_Tool.add_parent)}
					angle={Direction.left}
					size={toolDiameter}
					name='add_parent'/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.create, isHovering) }}
					handle_mouse_state={(mouse_state) => handle_mouse_data(mouse_state, T_Tool.create)}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(T_Tool.create)}
					angle={Direction.right}
					strokeColor={color}
					size={toolDiameter}
					name='add'/>
				<button id='delete'
					on:blur={u.ignore}
					on:focus={u.ignore}
					on:click={handle_delete_event}
					on:mouseout={() => { isHovering_byID[T_Tool.delete] = false; }}
					on:mouseover={() => { isHovering_byID[T_Tool.delete] = true; }}
					style='
						left: {getC(T_Tool.delete).x}px;
						top: {getC(T_Tool.delete).y}px;
						z-index: {ZIndex.dots};
						background: none;
						cursor: pointer;
						border: none;'>
					<Trash color={color} invert={isHovering_byID[T_Tool.delete]}/>
				</button>
			{/if}
		</div>
	{/if}
{/key}
