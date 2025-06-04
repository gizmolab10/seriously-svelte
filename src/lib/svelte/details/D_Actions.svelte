<script lang='ts'>
	import { T_Tool, T_Layer, T_Request, T_Predicate, T_Alteration } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { e, k, show, Size, Point, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/common/Stores';
	import { w_user_graph_offset } from '../../ts/common/Stores';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Button from '../buttons/Button.svelte';
	import { getContext } from 'svelte';
	export let top = 0;
	const has_title = true;
	const has_seperator = show.tool_boxes;
    const font_sizes = [k.font_size.smallest, has_seperator ? k.font_size.smaller : k.font_size.smallest];
	let ancestry = s_details.ancestry;
	let list_title = ancestry?.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
	let button_titles = compute_button_titles();
	let tools_top = top + (has_title ? 3 : -13);
    let reattachments = 0;
	const handle_banner_click = getContext('handle_banner_click');

	// buttons row sends column & T_Request:
	// 	 is_disabled calls:	handle_isTool_disabledAt
	//	 handle_click calls:	handle_tool_clickedAt ... n.b., long press generates multiple calls
	// buttons grid adds row (here it becomest_tool)
	
    $: top, tools_top = top + (has_title ? 3 : -13);
    $: $w_s_alteration, reattachments += 1;

	$:	$w_show_details_ofType,
		$w_user_graph_offset,
		$w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();

	function name_ofToolAt(t_tool: number, column: number): string { return Object.keys(k.actions[T_Tool[t_tool]])[column]; }

	function name_for(t_tool: number, column: number) {
		const titles = button_titles[t_tool];
		return `${titles[0]}.${titles[column]}`;
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles() {
		ancestry = s_details.ancestry;
		list_title = ancestry?.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = compute_button_titles();
		signals.signal_tool_update();
		reattachments += 1;
	}

	function isTool_invertedAt(t_tool: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const t_alteration = s_alteration?.t_alteration;
		return !!t_alteration && !!action && action == name_ofToolAt(t_tool, column)
			&& ((t_tool == T_Tool.add    && t_alteration == T_Alteration.add)
			||  (t_tool == T_Tool.delete && t_alteration == T_Alteration.delete));
	}

	function compute_button_titles() {
		return [
			['browse', 'left', 'up', 'down', 'right'],
			['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'left', 'up', 'down', 'right'],
			['list', `${list_title}`],
			['show', 'selection', 'root', 'all'],
			['graph', 'center', 'go to root', 'one list'],
		];
	}

	function handle_toolRequest(t_request: T_Request, s_mouse: S_Mouse, t_tool: number, column: number): any {
		const isAltering = !!$w_s_alteration;
		switch (t_request) {
			case T_Request.name:		 return name_ofToolAt(t_tool, column);
			case T_Request.is_disabled:  return e.handle_isTool_disabledAt(t_tool, column);
			case T_Request.is_inverted:  return !isAltering ? false : isTool_invertedAt(t_tool, column);
			case T_Request.is_visible:	 return !isAltering ? true : [T_Tool.add, T_Tool.delete].includes(t_tool);
			case T_Request.handle_click: return e.handle_tool_autorepeatAt(s_mouse, t_tool, column, name_for(t_tool, column + 1));
		}
		return null;
	}

</script>

{#key reattachments}
	<div
		class='actions'
		style='
			width: 100%;
			top:{tools_top}px;
			position:relative;
			z-index:{T_Layer.actions}'>
		<Buttons_Grid
			gap={3}
			columns={5}
			name='actions'
			has_title={has_title}
			font_sizes={font_sizes}
			width={k.width_details - 14}
			closure={handle_toolRequest}
			has_seperator={has_seperator}
			button_titles={button_titles}
			button_height={k.height.button}/>
		{#if $w_s_alteration}
			<div
				class='alteration-instructions'
				style='
					width: 100%;
					display:block;
					position:relative;
					text-align:center;
					top:{has_seperator ? 120 : 58}px;
					z-index:{T_Layer.actions + 1};
					font-size:{k.font_size.smallest}px;'>
				To <em>{$w_s_alteration.t_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
				<br> to <strong>{ancestry.title}</strong>
				<br> choose that item's <em>blinking</em> dot
				<br><br> When you are <em>done</em>,
				<br> click any enabled button (above)
			</div>
		{/if}
	</div>
{/key}
