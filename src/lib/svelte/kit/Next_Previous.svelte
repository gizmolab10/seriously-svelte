<script lang='ts'>
	import { k, Point, T_Request, S_Mouse } from '../../ts/common/Global_Imports';
	import Buttons_Row from '../buttons/Buttons_Row.svelte';
	export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => any;
	export let separator_thickness = k.thickness.separator.thick;
	export let height = k.height.controls;
	export let hasBothEnds = true;
	export let has_title = false;
	export let show_box = false;
	export let add_wings = true;
	export let name = k.empty;
	export let origin: Point;
	export let width = 144;
</script>

<Buttons_Row
	margin=0
	width={width}
	origin={origin}
	closure={closure}
	gap={6}
	show_box={show_box}
	has_title={has_title}
	add_wings={add_wings}
	button_height={height}
	hasBothEnds={hasBothEnds}
	name={'previous-next-' + name}
	separator_thickness={separator_thickness}
	row_titles={has_title ? [name, 'previous', 'next'] : ['previous', 'next']}
	font_sizes={[k.font_size.smallest, k.font_size.smaller]}/>