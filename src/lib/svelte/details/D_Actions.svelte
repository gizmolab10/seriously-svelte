<script lang='ts'>
	import { e, k, show, Size, Point, grabs, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { T_Action, T_Layer, T_Request, T_Predicate, T_Alteration } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { w_depth_limit, w_user_graph_offset, w_show_graph_ofType } from '../../ts/common/Stores';
	import { w_show_countDots_ofType, w_background_color } from '../../ts/common/Stores';
	import { k, u, Point, T_Kinship, colors } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	export let top = 0;
	const has_title = true;
	const middle_left = 40;
	const actions_height = 150;
	const top_separatorLength = 95;
	const bottom_separatorLength = 78;
	const grid_width = k.width_details - 12;
	const separator_font_size = k.font_size.smallest;
    const font_sizes = [k.font_size.smallest, k.font_size.smallest];
	let list_title = grabs.latest?.isExpanded && layout.inTreeMode ? 'hide list' : 'list';
	let actions_top = top + (has_title ? 3 : -13);
	let slider_top = actions_top + actions_height + 7;
	let button_titles = compute_button_titles();
    let reattachments = 0;

	////////////////////////////////////////////////////////////
	// buttons row sends column & T_Request:
	// 	 is_disabled calls:	 handle_isAction_disabledAt
	//	 handle_click calls: handle_action_clickedAt ...
	//   n.b., long press generates multiple calls
	// buttons grid adds row (here it becomes t_action)
	////////////////////////////////////////////////////////////
	
    $:	{
		const _ = top;
		actions_top = top + (has_title ? 3 : -13);
	}

	$: {
		const _ = `${$w_depth_limit}${$w_background_color}${$w_user_graph_offset}${$w_show_graph_ofType}${$w_s_alteration}`;
		reattachments += 1;
	}

	$: {
		const _ = `${$w_ancestries_expanded.join(',')}${$w_ancestries_grabbed.join(',')}`;
		update_button_titles();
	}
	
	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles(): void {
		const ancestry = grabs.latest;
		list_title = layout.inTreeMode && !!ancestry && ancestry.isExpanded ? 'hide list' : 'show list';
		button_titles = compute_button_titles();
		setTimeout(() => reattachments += 1, 0);
	}

	function group_andIndex(t_action: number): [number, number] {
		const index = t_action;
		const group = index < 5 ? 0 : 1;
		const index_withinGroup = index % 5;
		return [group, index_withinGroup];
	}

	function name_for(t_action: number, column: number): string {
		const [group, index] = group_andIndex(t_action);
		const titles = button_titles[group];
		if (!!titles && titles.length > column) {
			return `${titles[0]}.${titles[column]}`;
		}
		return k.empty;
	}

	function isAction_invertedAt(t_action: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const t_alteration = s_alteration?.t_alteration;
		return !!t_alteration && !!action && action == e.name_ofActionAt(t_action, column)
			&& ((t_action == T_Action.add    && t_alteration == T_Alteration.add)
			||  (t_action == T_Action.delete && t_alteration == T_Alteration.delete));
	}

	function compute_button_titles() {
		return [
			[['browse', 'left', 'up', 'down', 'right'],
			['focus', 'on the selection', 'on its parent'],
			['show', 'selection', `${list_title}`],
			['center', 'focus', 'selection', 'root', 'graph']],
			[['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'left', 'up', 'down', 'right']],
		];
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, name: string, t_action: number, column: number): any {
		if (name == 'bottom-actions') {
			t_action += 4;
		}
		const isAltering = !!$w_s_alteration;
		switch (t_request) {
			case T_Request.name:		 return e.name_ofActionAt(t_action, column);
			case T_Request.is_disabled:  return e.handle_isAction_disabledAt(t_action, column);
			case T_Request.is_inverted:  return !isAltering ? false : isAction_invertedAt(t_action, column);
			case T_Request.is_visible:	 return !isAltering ? true : [T_Action.add, T_Action.delete].includes(t_action);
			case T_Request.handle_click: return e.handle_action_autorepeatAt(s_mouse, t_action, column, name_for(t_action, column + 1));
		}
		return null;
	}

</script>

{#key reattachments}
	<div
		class='actions'
		style='
			width: 100%;
			position:absolute;
			top:{actions_top}px;
			z-index:{T_Layer.actions}'>
		{#if $w_s_alteration}
			<div
				class='alteration-instructions'
				style='
					width: 100%;
					display:block;
					position:absolute;
					text-align:center;
					z-index:{T_Layer.actions + 1};
					font-size:{k.font_size.smallest}px;'>
				<div style='top:12px; width: 100%; position:absolute;'>
					To <em>{$w_s_alteration.t_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
					<br> to <strong>{grabs.latest.title}</strong>
					<br> choose that item's <em>blinking</em> dot
				</div>
				<div style='top:84px; width: 100%; position:absolute;'>
					<br><br> When you are <em>done</em>,
					<br> click any enabled button (above)
				</div>
			</div>
		{:else}
			<Buttons_Grid
				top={1}
				gap={2}
				columns={5}
				name='top-actions'
				width={grid_width}
				has_title={has_title}
				font_sizes={font_sizes}
				closure={handle_actionRequest}
				button_height={k.height.button}
				button_titles={button_titles[0]}/>
			<Buttons_Grid
				gap={2}
				columns={5}
				width={grid_width}
				name='bottom-actions'
				has_title={has_title}
				font_sizes={font_sizes}
				top={top_separatorLength - 3}
				closure={handle_actionRequest}
				button_height={k.height.button}
				button_titles={button_titles[1]}/>
			<Separator
				isHorizontal={false}
				has_thin_divider={true}
				margin={k.details_margin}
				length={top_separatorLength}
				origin={new Point(middle_left, -6)}
				thickness={k.thickness.separator.ultra_thin}/>
			<Separator
				isHorizontal={false}
				has_thin_divider={true}
				margin={k.details_margin}
				length={bottom_separatorLength}
				thickness={k.thickness.separator.ultra_thin}
				origin={new Point(middle_left, top_separatorLength - 12)}/>
			<Separator
				isHorizontal={true}
				has_thin_divider={true}
				length={k.width_details}
				margin={k.details_margin}
				title='edit the hierarchy'
				title_left={k.separator_title_left}
				title_font_size={separator_font_size}
				origin={Point.y(top_separatorLength - 13)}
				thickness={k.thickness.separator.ultra_thin}/>
			{#if layout.inTreeMode}
				<Separator
					isHorizontal={true}
					has_thin_divider={true}
					length={k.width_details}
					margin={k.details_margin}
					origin={Point.y(slider_top - 6)}
					title_left={k.separator_title_left}
					title_font_size={separator_font_size}
					thickness={k.thickness.separator.ultra_thin}
					title={layout.inTreeMode ? 'maximum visible tree levels' : k.empty}/>
				<Slider
					max={12}
					isLogarithmic={true}
					value={$w_depth_limit}
					width={k.width_details - 26}
					isVisible={layout.inTreeMode}
					thumb_color={colors.separator}
					origin={new Point(10, slider_top)}
					title_left={k.separator_title_left}
					title_font_size={k.font_size.small}
					handle_value_change={handle_depth_limit}/>
			{/if}
		{/if}
	</div>
{/key}
