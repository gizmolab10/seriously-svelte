<script lang='ts'>
	import { c, k, u, ux, w, show, Rect, Size, Point, debug, colors, signals } from '../../ts/common/Global_Imports';
	import { T_Tool, T_Graph, T_Layer, T_Element, T_Alteration } from '../../ts/common/Global_Imports';
	import { layout, svgPaths, databases, Direction, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, S_Alteration } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_ancestry_showing_tools } from '../../ts/common/Stores';
	import { w_hierarchy, w_graph_rect } from '../../ts/common/Stores';
	import Transparent_Circle from '../kit/Transparent_Circle.svelte';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Triangle_Button from '../mouse/Triangle_Button.svelte';
	import { w_background_color } from '../../ts/common/Stores';
	import Widget_Reveal from '../widget/Widget_Reveal.svelte';
	import Buttons_Grid from '../mouse/Buttons_Grid.svelte';
	import Button from '../mouse/Button.svelte';
	import Trash from '../kit/Trash.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const toolDiameter = k.size.dot * 1.4;
	const editingToolsRadius = k.editingTools_diameter / 2;
	const parentAlteringIDs = [T_Tool.add_parent, T_Tool.delete_parent];
	const needsMultipleVisibleParents = [T_Tool.next, T_Tool.delete_parent];
	const half_circleViewBox = `0 0 ${k.editingTools_diameter} ${k.editingTools_diameter}`;
	let s_element_byToolType: { [id: string]: S_Element } = {};
	let isHovering_byID: { [id: string]: boolean } = {};
	let centers_byID: { [id: string]: Point } = {};
	let parentSensitiveColor = k.empty;
	let countOfVisibleParents = 0;
	let confirmingDelete = false;
	let graphRect = Rect.zero;
	let tool_reattachments = 0;
	let mouse_click_timer;
	let color = k.empty;
	let width_ofTitle = 0;
	let left = 64;
	let ancestry;
	let thing;
	function getC(id: string) { return centers_byID[id] ?? Point.zero; }
	function setC(id: string, center: Point) { return centers_byID[id] = center; }
	function alteration_forID(id: string) { return (id == T_Tool.add_parent) ? T_Alteration.adding : T_Alteration.deleting; }

	debug.log_tools('mount tools')
	setTimeout(() => { layout_tools_forceRedraw(); }, 20);

	onMount(() => {
		const handler = signals.handle_reattach_widgets(2, (ancestry) => {	// priority of 2 assures layout is finished
			layout_tools_forceRedraw(true);
		});
		return () => { handler.disconnect() };
	});

	function isInvertedFor(id: string) {
		return parentAlteringIDs.includes(id) && $w_s_alteration?.type == alteration_forID(id);
	}

	function isDisabledFor(id: string) {
		return ((ancestry.isFocus || thing.isBulkAlias) && (id == T_Tool.add_parent)) ||
		((countOfVisibleParents < 2) && needsMultipleVisibleParents.includes(id));
	}

	function reset_all_s_elements_for_ancestry_change() {
		if (!!ancestry) {
			debug.log_tools('element states')
			const ids = [T_Tool.delete_cancel, T_Tool.add_parent, T_Tool.delete_parent, T_Tool.delete_cancel, T_Tool.delete_confirm, T_Tool.dismiss, T_Tool.create, T_Tool.next, T_Tool.more];
			for (const id of ids) {
				const isDismiss = (id == T_Tool.dismiss);
				const es_tool = ux.s_element_for(ancestry, T_Element.tool, id);
				es_tool.color_background = isDismiss ? $w_background_color : 'transparent';
				es_tool.set_forHovering(color, 'pointer');
				es_tool.ignore_hover = !isDismiss;
				s_element_byToolType[id] = es_tool;
			}		
		}
	}

	$: {
		if (graphRect != $w_graph_rect) {
			graphRect = $w_graph_rect;
			layout_tools_forceRedraw();
		}
	}

	$: {
		if (!ancestry || !ancestry.equals($w_ancestry_showing_tools)) {
			ancestry = $w_ancestry_showing_tools;
			if (!!ancestry) {
				thing = ancestry.thing;
				color = thing?.color ?? k.empty;
				width_ofTitle = thing?.width_ofTitle ?? 0;
				const hasOneParent = (thing?.parents.length ?? 0) == 1;
				countOfVisibleParents = ancestry.visibleParentAncestries(0).length;
				parentSensitiveColor = (hasOneParent || ancestry.isFocus) ? colors.disabled : color ;
				reset_all_s_elements_for_ancestry_change();
				layout_tools_forceRedraw(true);
			}
		}
	}

	function titleOffsetX(): number {
		return !ancestry ? 0 : layout.inRadialMode ? ancestry.points_right ? width_ofTitle + 23 : -6 : ancestry.shows_reveal ? width_ofTitle + 25 : width_ofTitle + 17;
	}

	function handle_delete_event(event) {
		if (!isDisabledFor(T_Tool.delete)) {
			confirmingDelete = true;
		}
	}

	function fillColorsFor(id: string, isFilled: boolean): [string, string] {
		const isDisabled = isDisabledFor(id);
		const nextIsDisabled = isDisabled && needsMultipleVisibleParents.includes(id);
		if (isDisabled || (isFilled == isInvertedFor(id))) {
			const extraColor = nextIsDisabled ? colors.disabled : isDisabled || isFilled ? parentSensitiveColor : color;
			return [$w_background_color, extraColor];
		}
		return [color, $w_background_color];
	}

	async function handle_mouse_data(s_mouse: S_Mouse, id: string) {
		if (s_mouse.isHover) {
			const es_tool = s_element_byToolType[id];
			const isOut = s_mouse.isOut;
			isHovering_byID[id] = !isOut;
			es_tool.isOut = isOut;
		} else if (s_mouse.isUp || s_mouse.isLong) {
			switch (id) {
				case T_Tool.delete_cancel: confirmingDelete = false; break;
				default:
					if (!isDisabledFor(id)) {
						await $w_hierarchy.handle_tool_clicked(id, s_mouse);
					}
					break;
			}
			layout_tools_forceRedraw();
		}
	}

	function layout_tools_forceRedraw(force: boolean = false) {
		let rect = ancestry?.titleRect?.atZero;
		if (!!rect && rect.size.width != 0) {
			debug.log_layout(`setC all tools ${rect.description}`);
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
			tool_reattachments += 1;
		} else if (force) {
			tool_reattachments += 1;
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

{#key tool_reattachments}
	{#if !!$w_ancestry_showing_tools}
		<div class='editing-tools' style='
			position:absolute;
			z-index: {T_Layer.tools}'>
			<Buttons_Grid
				width={200}
				rows={3}
				columns={4}
				font_size={14}
				button_titles={[
					['1', '2', '3', '4'],
					['5', '6', '7', '8'],
					['9', '10', '11', '12']
				]}
			/>
			<Transparent_Circle
				color_background={colors.opacitize($w_background_color, 0.95)}
				center={getC(T_Tool.editingTools)}
				radius={editingToolsRadius}
				zindex={T_Layer.dots}
				color={color}
				opacity=0.85
				thickness=1/>
			{#if confirmingDelete}
				{#if isHovering_byID[T_Tool.delete_confirm]}
					<svg class='delete-confirm' style='
							left:{getC(T_Tool.confirmation).x}px;
							top:{getC(T_Tool.confirmation).y}px;
							z-index:{T_Layer.dots};'
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
							z-index:{T_Layer.dots};'
						height={k.editingTools_diameter}
						width={k.editingTools_diameter}
						viewBox={half_circleViewBox}
						stroke='transparent'
						fill={thing.color}>
						<path class='delete-cancel-path' d={svgPaths.half_circle(k.editingTools_diameter, Direction.down)}/>
					</svg>
				{/if}
				<Button
					closure={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.delete_confirm)}
					es_button={s_element_byToolType[T_Tool.delete_confirm]}
					center={getC(T_Tool.delete_confirm)}
					height={k.editingTools_diameter / 2}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={T_Layer.dots}
					color='transparent'
					border_thickness=0
					name='delete'>
					{#key isHovering_byID[T_Tool.delete_confirm]}
						<div style='
							color: {isHovering_byID[T_Tool.delete_confirm] ? 'white' : thing.color};
							z-index: {T_Layer.frontmost};
							position: absolute;
							left: 13px;
							top: 11px;'>
							delete
						</div>
					{/key}
				</Button>
				<Button
					closure={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.delete_cancel, )}
					es_button={s_element_byToolType[T_Tool.delete_cancel]}
					height={k.editingTools_diameter / 2}
					center={getC(T_Tool.delete_cancel)}
					width={k.editingTools_diameter}
					background_color='transparent'
					zindex={T_Layer.dots}
					color='transparent'
					border_thickness=0
					name='cancel'>
					{#key isHovering_byID[T_Tool.delete_cancel]}
						<div style='
							top: 4px;
							left: 13px;
							position: absolute;
							z-index: {T_Layer.frontmost};
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
						background-color:{colors.separator};
						z-index: {T_Layer.tool_buttons};
						position: absolute;
						height: 1px;'>
				</div>
			{:else}
				<Button
					closure={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.more)}
					es_button={s_element_byToolType[T_Tool.more]}
					height={k.size.button}
					zindex={T_Layer.tool_buttons}
					center={getC(T_Tool.more)}
					color='transparent'
					border_thickness=0
					name='more'
					width=18>
					<svg width=18
						stroke={color}
						class='more-svg' 
						viewBox='0 1 18 16'
						height={k.size.button}
						fill={isHovering_byID[T_Tool.more] ? color : 'transparent'}>
						<path class='more-path' d={svgPaths.oval(18, true)}/>
					</svg>
					<svg height=10
						class='ellipses-svg' 
						viewBox='-0.5 -2 14 10'
						width={k.size.button}
						fill={isHovering_byID[T_Tool.more] ? $w_background_color : color}>
						<path class='ellipses-path' d={svgPaths.ellipses(7, 1)}/>
					</svg>
				</Button>
				<Widget_Reveal
					name={s_element_byToolType[T_Tool.dismiss].name}
					ancestry={$w_ancestry_showing_tools}
					center={getC(T_Tool.dismiss)}
					zindex={T_Layer.tool_buttons}
					hover_isReversed=true/>
				<Triangle_Button
					strokeColor={isDisabledFor(T_Tool.next) ? colors.disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.next, isHovering) }}
					handle_mouse_state={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.next)}
					extraPath={svgPaths.circle_atOffset(toolDiameter, 4)}
					center={getC(T_Tool.next)}
					angle={Direction.up}
					size={toolDiameter}
					name='next'/>
				<Triangle_Button
					strokeColor={isDisabledFor(T_Tool.delete_parent) ? colors.disabled : parentSensitiveColor}
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.delete_parent, isHovering) }}
					handle_mouse_state={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.delete_parent)}
					extraPath={svgPaths.dash(toolDiameter, 4)}
					center={getC(T_Tool.delete_parent)}
					angle={Direction.left}
					name='delete_parent'
					size={toolDiameter}/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.add_parent, isHovering) }}
					handle_mouse_state={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.add_parent)}
					strokeColor={isDisabledFor(T_Tool.add_parent) ? colors.disabled : color}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(T_Tool.add_parent)}
					angle={Direction.left}
					size={toolDiameter}
					name='add_parent'/>
				<Triangle_Button
					hover_closure={(isHovering) => { return fillColorsFor(T_Tool.create, isHovering) }}
					handle_mouse_state={(s_mouse) => handle_mouse_data(s_mouse, T_Tool.create)}
					extraPath={svgPaths.t_cross(toolDiameter, 3)}
					center={getC(T_Tool.create)}
					angle={Direction.right}
					strokeColor={color}
					size={toolDiameter}
					name='add'/>
				<button id='delete'
					on:blur={u.ignore}
					on:focus={u.ignore}
					on:keyup={u.ignore}
					on:keydown={u.ignore}
					on:click={handle_delete_event}
					on:mouseout={() => { isHovering_byID[T_Tool.delete] = false; }}
					on:mouseover={() => { isHovering_byID[T_Tool.delete] = true; }}
					style='
						left: {getC(T_Tool.delete).x}px;
						top: {getC(T_Tool.delete).y}px;
						z-index: {T_Layer.dots};
						background: none;
						cursor: pointer;
						border: none;'>
					<Trash color={color} invert={isHovering_byID[T_Tool.delete]}/>
				</button>
			{/if}
		</div>
	{/if}
{/key}
