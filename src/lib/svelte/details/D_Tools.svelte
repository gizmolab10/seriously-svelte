<script lang='ts'>
	import { k, Size, T_Layer } from '../../ts/common/Global_Imports';
	import Buttons_Grid from '../mouse/Buttons_Grid.svelte';
	import { w_hierarchy } from '../../ts/common/Stores';
	export let top = 0;

	const button_titles=[
		['browse', 'after', 'before', 'in', 'out'],
		['list', 'conceal', 'reveal'],
		['add', 'child', 'sibling', 'parent', 'related'],
		['delete', 'selection', 'parent', 'related'],
		['move', 'after', 'before', 'in', 'out']];

	function name_for(row, column) {
		const titles = button_titles[row];
		return `${titles[0]} ${titles[column]}`;
	}

	function closure(s_mouse, row, column) {
		if (!s_mouse.isHover && s_mouse.isDown) {
			$w_hierarchy.handle_tool_clicked_at(row, column, s_mouse, name_for(row, column));
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
		columns=5
		closure={closure}
		gap={new Size(2, 3)}
		width={k.width_details}
		button_height={k.size.dot}
		button_titles={button_titles}
		font_size={k.font_size.smallest}
	/>
</div>
