<script lang='ts'>
	import { T_Layer, T_Details, T_Action, T_Element, T_Kinship, T_Request, T_Predicate, T_Alteration } from '../../ts/common/Global_Imports';
	import { e, h, k, u, ux, show, Size, Point, grabs, colors, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { w_depth_limit, w_user_graph_offset, w_show_graph_ofType } from '../../ts/common/Stores';
	import { w_background_color } from '../../ts/common/Stores';
	import Buttons_Table from '../buttons/Buttons_Table.svelte';
    import { s_details } from '../../ts/state/S_Details';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	import Slider from '../mouse/Slider.svelte';
	export let top = 2;
	const title_gap = 4;
	const has_title = true;
	const top_tableHeight = 94;
	const left_afterTitle = 39.5;
	const bottom_tableHeight = 73;
	const table_width = k.width_details - 8;
	const bottom_padding = bottom_tableHeight - 48;
    const font_sizes = [k.font_size.instructions, k.font_size.instructions];
    const s_banner_hideable = s_details.s_banner_hideables_byType[T_Details.actions];
	const es_cancel = ux.s_element_for(grabs.latest, T_Element.cancel, k.empty);
	let list_title = grabs.latest?.isExpanded && ux.inTreeMode ? 'hide list' : 'list';
	let button_titles = compute_button_titles();
	let actions_top = top + 3;
    let reattachments = 0;
	es_cancel.set_forHovering(colors.default, 'pointer');

	//////////////////////////////////////////////////////////////
	//															//
	//  buttons row sends column & T_Request:					//
	// 	  is_disabled calls:	handle_isAction_disabledAt		//
	//	  handle_click calls:	handle_action_clickedAt ...		//
	//    n.b., long press generates multiple calls				//
	//  buttons table adds row (here it becomes row)			//
	//															//
	//////////////////////////////////////////////////////////////
	
    $:	{
		const _ = top;
		actions_top = top + 3;
	}

	$: {
		const _ = `${$w_background_color}${$w_user_graph_offset}${$w_show_graph_ofType}${$w_s_alteration}`;
		reattachments++;
	}

	$: {
		const _ = `${$w_ancestries_expanded?.join(',')}${$w_ancestries_grabbed?.join(',')}`;
		update_button_titles();
	}

	function row_isAltering(row: number): boolean {
		return [T_Action.add, T_Action.delete].includes(row);
	}

	function handle_cancel(s_mouse: S_Mouse) {
		if (s_mouse.isDown) {
			h.stop_alteration();
		}
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles(): void {
		const ancestry = grabs.latest;
		list_title = ux.inTreeMode && !!ancestry && ancestry.isExpanded ? 'hide list' : 'show list';
		button_titles = compute_button_titles();
		setTimeout(() => reattachments++, 0);
	}

	function group_andIndex(row: number): [number, number] {
		const index = row;
		const group = index < 5 ? 0 : 1;
		const index_withinGroup = index % 5;
		return [group, index_withinGroup];
	}

	function name_for(row: number, column: number): string {
		const [group, index] = group_andIndex(row);
		const titles = button_titles[group][row];
		if (!!titles && titles.length > column) {
			return `${titles[0]}-${titles[column]}`;
		}
		return k.empty;
	}

	function isAction_invertedAt(row: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const t_alteration = s_alteration?.t_alteration;
		return !!t_alteration && !!action && action == e.name_ofActionAt(row, column)
			&& ((row == T_Action.delete && t_alteration == T_Alteration.delete)
			||  (row == T_Action.add    && t_alteration == T_Alteration.add));
	}

	function compute_button_titles() {
		return [
			[['browse', 'left', 'up', 'down', 'right'],
			['focus', 'selection', 'parent of selection'],
			['show', 'selection', `${list_title}`, 'entire graph'],
			['center', 'focus', 'selection', 'root', 'graph']],
			[['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'left', 'up', 'down', 'right']],
		];
	}

	function handle_action_autorepeatAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		if (!s_mouse.isHover) {
			const valid_autorepeat = [T_Action.browse, T_Action.move].includes(t_action);
			if (s_mouse.isDown || (s_mouse.isRepeat && valid_autorepeat)) {
				e.handle_action_clickedAt(s_mouse, t_action, column, name);
			}
		}
		return null;
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, name: string, row: number, column: number): any {
		if (name == 'bottom-actions') {
			row += 4;
		}
		const isAltering = !!$w_s_alteration;
		switch (t_request) {
			case T_Request.name:		 return e.name_ofActionAt(row, column);
			case T_Request.is_visible:	 return !isAltering ? true : row_isAltering(row);
			case T_Request.is_disabled:  return e.handle_isAction_disabledAt(row, column);
			case T_Request.is_inverted:  return !isAltering ? false : isAction_invertedAt(row, column);
			case T_Request.handle_click: return handle_action_autorepeatAt(s_mouse, row, column, name_for(row, column + 1));
		}
		return null;
	}

</script>

{#key reattachments}
	<div
		class='actions'
		style='
			width: 100%;
			position:relative;
			top:{actions_top}px;
			z-index:{T_Layer.detailsPlus_2};
			padding-bottom:{bottom_padding}px;'>
		{#if $w_s_alteration}
			<div
				class='alteration-instructions'
				style='
					width: 100%;
					display:block;
					position:relative;
					text-align:center;
					z-index:{T_Layer.detailsPlus_2 + 1};
					font-size:{k.font_size.instructions}px;'>
				<div style='top:9px; width: 100%; position:relative;'>
					To <em>{$w_s_alteration.t_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
					<br> to <strong>{grabs.latest.title}</strong>
					<br> choose that item's <em>blinking</em> dot
				</div>
				<Button
					center={new Point(k.width_details / 2, 22)}
					font_size={k.font_size.instructions}
					zindex={T_Layer.frontmost}
					name='cancel-alteration'
					height={k.height.button}
					closure={handle_cancel}
					color = colors.default
					es_button={es_cancel}
					position='relative'
					width={40}>
					cancel
				</Button>
			</div>
		{:else}
			<Buttons_Table
				top={1}
				gap={2}
				name='first'
				width={table_width}
				has_title={has_title}
				title_gap={title_gap}
				type={T_Element.action}
				font_sizes={font_sizes}
				detect_autorepeat={true}
				closure={handle_actionRequest}
				button_height={k.height.button}
				button_titles={button_titles[0]}/>
			<Separator
				isHorizontal={false}
				has_thin_divider={true}
				length={top_tableHeight}
				margin={k.details_margin}
				origin={new Point(left_afterTitle, -4)}
				thickness={k.thickness.separator.details}/>
			<Buttons_Table
				gap={2}
				top={17}
				name='second'
				width={table_width}
				has_title={has_title}
				title_gap={title_gap}
				type={T_Element.action}
				font_sizes={font_sizes}
				detect_autorepeat={true}
				closure={handle_actionRequest}
				button_height={k.height.button}
				button_titles={button_titles[1]}/>
			<Separator
				isHorizontal={false}
				has_thin_divider={true}
				margin={k.details_margin}
				length={bottom_tableHeight}
				thickness={k.thickness.separator.details}
				origin={new Point(left_afterTitle, top_tableHeight - 11)}/>
			<Separator
				isHorizontal={true}
				has_thin_divider={true}
				length={k.width_details}
				margin={k.details_margin}
				title='edit your hierarchy'
				title_left={k.separator_title_left}
				origin={Point.y(top_tableHeight - 11)}
				thickness={k.thickness.separator.details}/>
		{/if}
	</div>
{/key}
