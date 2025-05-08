<script lang='ts'>
	import { w_hierarchy, w_s_alteration, w_count_button_restyle } from '../../ts/common/Stores';
	import { T_Tool, T_Layer, T_Request, T_Alteration } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { k, show, Size, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	export let top = 0;
	const show_boxes = show.tool_boxes;
    const font_sizes = [k.font_size.smallest, show_boxes ? k.font_size.smaller : k.font_size.smallest];
	let ancestry = $w_hierarchy.grabs_latest_upward(true);
	let list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
	let button_titles = updated_button_titles;
    let reattachments = 0;

	// buttons row sends column & T_Request:
	// 	query_disabled		isTool_disabledAt
	//	handle_click		handle_tool_clickedA ... n.b., long press generates multiple calls
	// buttons grid adds row (here it becomest_tool)

	function updated_button_titles() {
		return [
			['browse', 'up', 'down', 'left', 'right'],
			['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'up', 'down', 'left', 'right'],
			['list', `${list_title}`],
			['show', 'selection', 'root'],
			['graph', 'center'],
		];
	}
	
    $: $w_s_alteration, reattachments += 1;

	$:	$w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();
		$w_count_button_restyle += 1

	function name_for(t_tool: number, column: number) {
		const titles = button_titles[t_tool];
		return `${titles[0]} ${titles[column]}`;
	}

	function update_button_titles() {
		ancestry = $w_hierarchy.grabs_latest_upward(true);
		list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = updated_button_titles();
	}

	function isTool_invertedAt(t_tool: number, column: number): boolean {
		const s_alteration = $w_s_alteration;
		return !!s_alteration
			&& ((t_tool == T_Tool.add    && s_alteration.t_alteration == T_Alteration.adding   && column > 2)
			||  (t_tool == T_Tool.delete && s_alteration.t_alteration == T_Alteration.deleting && column > 0));
	}

	function closure(t_request: T_Request, s_mouse: S_Mouse, t_tool: number, column: number): boolean {
		switch (t_request) {
			case T_Request.query_disabled:
				return $w_hierarchy.isTool_disabledAt(t_tool, column);
			case T_Request.query_inverted:
				return !$w_s_alteration ? false : isTool_invertedAt(t_tool, column);
			case T_Request.query_visibility:
				return !$w_s_alteration ? true : [T_Tool.add, T_Tool.delete].includes(t_tool);
			case T_Request.handle_click:
				if (s_mouse.isDown) {
					return $w_hierarchy.handle_tool_clickedAt(t_tool, column, s_mouse, name_for(t_tool, column + 1));
				}
		}
		return false;
	}

</script>

<div
	class='editing-tools'
	style='
		top:{top + 1}px;
		position:absolute;
		z-index: {T_Layer.tools}'>
    {#key reattachments}
		<Buttons_Grid
			gap={3}
			columns={5}
			closure={closure}
			font_sizes={font_sizes}
			show_boxes={show_boxes}
			width={k.width_details}
			button_height={k.size.button}
			button_titles={button_titles}/>
    {/key}
</div>
