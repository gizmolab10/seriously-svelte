<script lang='ts'>
	import { k, u, ux, Rect, Size, Point, G_Segment } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import Segment from './Segment.svelte';
	export let selection_closure = Handle_Result<string>;
	export let selected: Array<string> = [];
	export let titles: Array<string> = [];
	export let fill = $w_background_color;
	export let stroke = k.color_default;
	export let allow_multiple = false;
	export let height = k.row_height;
	export let font_size = '0.95em';
	export let origin = Point.zero;
    export let name = k.empty;
	let g_segments: Array<G_Segment> = [];
	let width = height / 2;

	update_g_segments_andWidth();
	function isSelected(title: string) { return selected.includes(title); }
	function nextAfter(title: string): string { return titles[titles.indexOf(title).increment(true, titles.length)]; }		// next one after title

	function reset_g_segments_andWidth() {
		width = height / 2;
		g_segments = [];
	}

	function update_g_segments_andWidth() {
		const max_index = titles.length - 1;
		let index = 0;
		let x = 0;
		reset_g_segments_andWidth();
		for (const title of titles) {
			const g_segment = G_Segment.grab_g_segment(name, title, font_size, isSelected(title), index, max_index, x, height);
			g_segments.push(g_segment);
			x += g_segment.width;
			index += 1;
		}
		width = x;
	}

	function hit_closure(title: string, shift: boolean) {
		// if allow_multiple, merely toggle title, including none selected
		const notSelected = !isSelected(title)
		if (!allow_multiple) {
			selected = notSelected ? [title] : [nextAfter(title)];
		} else if (notSelected) {
			selected.push(title);
		} else {
			selected = selected.filter(t => t != title);
		}
		selection_closure(selected);
	}

</script>

<div
	class='segmented'
	id={name}
	style='
		width:{width}px;
		top:{origin.y}px;
		left:{origin.x}px;
		position:absolute;
		height:{height}px;'>
	{#each g_segments as g_segment}
		<Segment
			fill={fill}
			stroke={stroke}
			g_segment={g_segment}
			hit_closure={hit_closure}/>
	{/each}
</div>
