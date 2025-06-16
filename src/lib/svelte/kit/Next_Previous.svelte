<script lang='ts'>
	import { k, Point, S_Mouse, T_Request, T_Direction } from '../../ts/common/Global_Imports';
	import Buttons_Row from '../buttons/Buttons_Row.svelte';
	export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => any;
	export let separator_thickness = k.thickness.separator.thick;
	export let height = k.height.controls;
	export let hasBothEnds = true;
	export let has_title = false;
	export let has_seperator = false;
	export let add_wings = true;
	export let name = k.empty;
	export let origin: Point;
	export let width = 144;
	export let margin = 0;
	const base_titles = [T_Direction.previous, T_Direction.next];
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;

</script>

<div class='next-previous' style='margin-bottom: 32px;'>
	<Buttons_Row
		gap={4}
		width={width}
		margin={margin}
		origin={origin}
		closure={closure}
		has_title={has_title}
		add_wings={add_wings}
		button_height={height}
		row_titles={row_titles}
		hasBothEnds={hasBothEnds}
		has_seperator={has_seperator}
		name={'previous-next-' + name}
		separator_thickness={separator_thickness}
		font_sizes={[k.font_size.smallest, k.font_size.smaller]}/>
</div>
