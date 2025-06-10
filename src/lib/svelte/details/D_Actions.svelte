<script lang='ts'>
	import { e, k, show, Size, Point, grabs, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { T_Action, T_Layer, T_Request, T_Predicate, T_Alteration } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { w_show_countDots_ofType, w_background_color } from '../../ts/common/Stores';
	import { k, u, Point, T_Kinship, colors } from '../../ts/common/Global_Imports';
	import { w_depth_limit, w_user_graph_offset } from '../../ts/common/Stores';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { getContext } from 'svelte';
	export let top = 0;
	const has_title = true;
	const separator_font_size = k.font_size.smallest;
    const font_sizes = [k.font_size.smallest, k.font_size.smallest];
	let list_title = grabs.latest?.isExpanded && layout.inTreeMode ? 'hide list' : 'list';
	let actions_top = top + (has_title ? 3 : -13);
	let button_titles = compute_button_titles();
	let actions_height = 144;
    let reattachments = 0;
	const handle_banner_click = getContext('handle_banner_click');

	////////////////////////////////////////////////////////////
	// buttons row sends column & T_Request:
	// 	 is_disabled calls:	 handle_isAction_disabledAt
	//	 handle_click calls: handle_action_clickedAt ...
	//   n.b., long press generates multiple calls
	// buttons grid adds row (here it becomes t_action)
	////////////////////////////////////////////////////////////
	
    $: top, actions_top = top + (has_title ? 3 : -13);
    $: $w_depth_limit,
		$w_s_alteration,
		$w_background_color,
		$w_user_graph_offset,
		reattachments += 1;

	$:	$w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();
	
	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

	function name_for(t_action: number, column: number) {
		const titles = button_titles[t_action];
		return `${titles[0]}.${titles[column]}`;
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles() {
		const ancestry = grabs.latest;
		list_title = layout.inTreeMode && !!ancestry && ancestry.isExpanded ? 'hide list' : 'list';
		button_titles = compute_button_titles();
		setTimeout(() => reattachments += 1, 0);
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

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, t_action: number, column: number): any {
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
			top:{actions_top}px;
			position:relative;
			z-index:{T_Layer.actions}'>
		<Buttons_Grid
			gap={2}
			top={0}
			columns={5}
			name='actions'
			has_title={has_title}
			font_sizes={font_sizes}
			width={k.width_details - 12}
			closure={handle_actionRequest}
			button_titles={button_titles[0]}
			button_height={k.height.button}/>
		<Buttons_Grid
			gap={2}
			top={87}
			columns={5}
			name='actions'
			has_title={has_title}
			font_sizes={font_sizes}
			width={k.width_details - 12}
			closure={handle_actionRequest}
			button_titles={button_titles[1]}
			button_height={k.height.button}/>
		<Separator
			length={92}
			isHorizontal={false}
			has_thin_divider={false}
			margin={k.details_margin}
			origin={new Point(37, -6)}
			thickness={k.thickness.separator.ultra_thin}/>
		<Separator
			origin={Point.y(79)}
			has_thin_divider={false}
			length={k.width_details}
			margin={k.details_margin}
			title='edit the hierarchy'
			title_left={k.separator_title_left}
			title_font_size={separator_font_size}
			thickness={k.thickness.separator.ultra_thin}/>
		<Separator
			length={74}
			isHorizontal={false}
			has_thin_divider={false}
			margin={k.details_margin}
			origin={new Point(37, 80)}
			thickness={k.thickness.separator.ultra_thin}/>
		<Separator
			has_thin_divider={false}
			length={k.width_details}
			margin={k.details_margin}
			title='maximum visible tree levels'
			title_left={k.separator_title_left}
			title_font_size={separator_font_size}
			thickness={k.thickness.separator.ultra_thin}
			origin={Point.y(actions_top + actions_height)}/>
		<Slider
			max={12}
			isLogarithmic={true}
			value={$w_depth_limit}
			width={k.width_details - 26}
			thumb_color={colors.separator}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.small}
			handle_value_change={handle_depth_limit}
			origin={new Point(10, actions_top + actions_height + 7)}/>
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
		{/if}
	</div>
{/key}
