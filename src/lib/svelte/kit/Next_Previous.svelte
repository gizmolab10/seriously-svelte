<script lang='ts'>
	import { k, Point, T_Request, S_Mouse } from '../../ts/common/Global_Imports';
	import Buttons_Row from '../buttons/Buttons_Row.svelte';
	export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => any;
	export let origin: Point;
</script>

<Buttons_Row
	margin=0
	width=149
	origin={origin}
	show_box={false}
	closure={closure}
	has_title={false}
	button_height={18}
	horizontal_gap={6}
	name='previous-next'
	row_titles={['previous', 'next']}
	font_sizes={[k.font_size.smallest, k.font_size.smaller]}/>