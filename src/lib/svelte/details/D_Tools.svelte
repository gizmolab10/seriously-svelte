<script lang='ts'>
	import { w_hierarchy, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { k, show, Size, layout, T_Layer, T_Request } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	export let top = 0;
	const show_boxes = show.tool_boxes;
    const font_sizes = [k.font_size.smallest, show_boxes ? k.font_size.smaller : k.font_size.smallest];
	let ancestry = $w_hierarchy.latest_grabbed_upward(true);
	let list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
	let button_titles = updated_button_titles;

	// buttons row sends column & T_Request:
	// 	query_disabled		isTool_disabledAt
	//	handle_click		handle_tool_clickedA ... n.b., long press generates multiple calls
	// buttons grid adds row

	$:	w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();

	function name_for(row, column) {
		const titles = button_titles[row];
		return `${titles[0]} ${titles[column]}`;
	}

	function update_button_titles() {
		ancestry = $w_hierarchy.latest_grabbed_upward(true);
		list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = updated_button_titles();
	}

	function closure(t_request, s_mouse, row, column): boolean {
		if (t_request == T_Request.query_disabled) {
			return $w_hierarchy.isTool_disabledAt(row, column);
		} else if (!s_mouse.isHover && s_mouse.isDown) {
			return $w_hierarchy.handle_tool_clickedAt(row, column, s_mouse, name_for(row, column + 1));
		}
		return false;
	}

	function updated_button_titles() {
		return [
			['show', 'selection', 'root'],
			['browse', 'before', 'after', 'out', 'in'],
			['list', `${list_title}`],
			['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'before', 'after', 'out', 'in'],
			['graph', 'center']];
	}

</script>

<div
	class='editing-tools'
	style='
		top:{top + 1}px;
		position:absolute;
		z-index: {T_Layer.tools}'>
	<Buttons_Grid
		gap={3}
		columns={5}
		closure={closure}
		font_sizes={font_sizes}
		show_boxes={show_boxes}
		width={k.width_details}
		button_height={k.size.button}
		button_titles={button_titles}/>
</div>
