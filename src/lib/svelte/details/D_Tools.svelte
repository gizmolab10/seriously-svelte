<script lang='ts'>
	import { k, show, Size, T_Layer } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import { w_hierarchy } from '../../ts/common/Stores';
	export let top = 0;
	const show_boxes = show.tool_boxes;
	const font_size = show_boxes ? k.font_size.smaller : k.font_size.smallest;
    const font_sizes = [font_size, font_size + (show_boxes ? -1 : 0)];

	const button_titles=[
		['graph', 'reveal selection', 'center'],
		['browse', 'before', 'after', 'in', 'out'],
		['list', 'conceal', 'reveal'],
		['add', 'child', 'sibling', 'line', 'parent', 'related'],
		['delete', 'selection', 'parent', 'related'],
		['move', 'before', 'after', 'in', 'out']];

	function name_for(row, column) {
		const titles = button_titles[row];
		return `${titles[0]} ${titles[column]}`;
	}

	function closure(s_mouse, row, column) {
		if (!s_mouse.isHover && s_mouse.isDown) {
			$w_hierarchy.handle_tool_clicked_at(row, column, s_mouse, name_for(row, column + 1));
		}
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
		button_titles={button_titles}
		button_height={k.size.dot + 2}
	/>
</div>
