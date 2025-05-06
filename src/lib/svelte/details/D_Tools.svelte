<script lang='ts'>
	import { k, show, Size, T_Layer, T_Request } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import { w_hierarchy } from '../../ts/common/Stores';
	export let top = 0;
	const show_boxes = show.tool_boxes;
    const font_sizes = [k.font_size.smallest, show_boxes ? k.font_size.smaller : k.font_size.smallest];

	// knows all the tools
	// hierarchy knows what each tool does ... handle_tool_request_at
	// hierarchy knows what is disabled ... " "
	// button row sends column and T_Request:
	// 	query_disabled		based on grabbed ancestry
	//	handle_click		or long press generates many calls
	// grid adds row:

	const button_titles=[
		['show', 'selection', 'root'],
		['browse', 'before', 'after', 'out', 'in'],
		['list', 'conceal', 'reveal'],
		['add', 'child', 'sibling', 'line', 'parent', 'related'],
		['delete', 'selection', 'parent', 'related'],
		['move', 'before', 'after', 'out', 'in'],
		['graph', 'center']];

	function name_for(row, column) {
		const titles = button_titles[row];
		return `${titles[0]} ${titles[column]}`;
	}

	function closure(t_request, s_mouse, row, column): boolean {
		if (t_request == T_Request.query_disabled) {
			return $w_hierarchy.isTool_disabledAt(row, column);
		} else if (!s_mouse.isHover && s_mouse.isDown) {
			return $w_hierarchy.handle_tool_clickedAt(row, column, s_mouse, name_for(row, column + 1));
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
