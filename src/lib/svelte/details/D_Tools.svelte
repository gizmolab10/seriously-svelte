<script lang='ts'>
	import { k, Size, T_Layer } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_background_color } from '../../ts/common/Stores';
	import Buttons_Grid from '../mouse/Buttons_Grid.svelte';
	export let top = 0;
	const ancestry = $w_hierarchy.grabs_latest_ancestry;

	const button_titles=[
		['browse', 'down', 'up', 'right', 'left'],
		['add', 'child', 'sibling', 'parent', 'related'],
		['relocate', 'down', 'up', 'right', 'left'],
		['delete', 'selection', 'parent', 'related']];

	function closure(s_mouse, row_index, col_index) {
		if (s_mouse.isHover && !s_mouse.isOut) {
			// console.log(s_mouse.description, row_index, col_index);
		}
	}

</script>

<div
	class='editing-tools'
	style='
		top:{top}px;
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
