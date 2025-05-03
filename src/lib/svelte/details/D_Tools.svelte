<script lang='ts'>
	import { k, Point, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	import Buttons_Grid from '../mouse/Buttons_Grid.svelte';
	export let top = 0;
	let ancestry;
	let thing;

	const button_titles=[
		['browse', 'left', 'right', 'up', 'down'],
		['relocate', 'left', 'right', 'up', 'down'],
		['add', 'child', 'parent', 'related', 'sibling'],
		['delete', 'selected', 'parent', 'related']];

</script>

<div
	class='editing-tools'
	style='
		top:{top}px;
		position:absolute;
		z-index: {T_Layer.tools}'>
	<Buttons_Grid
		rows=4
		columns=5
		gap={new Point(3, 2)}
		width={k.width_details}
		button_height={k.size.dot}
		button_titles={button_titles}
		font_size={k.font_size.smallest}
	/>
</div>
