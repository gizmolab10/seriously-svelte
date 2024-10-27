<script lang='ts'>
	import { k, u, Rect, Size, Point, Segment_Map } from '../../ts/common/Global_Imports';
	import Segment from './Segment.svelte';
	export let selection_closure = (selectionArray) => {};
	export let titles: Array<string> = [];
	export let fill = k.color_background;
	export let height = k.row_height - 2;
	export let origin = Point.zero;
	export let stroke = k.color_default;
	export let multiple = false;
	let selected_indices: Array<number> = [];
	let segment_maps: Array<Segment_Map> = [];
	let width = 0;

	update_maps_width();

	function reset_maps_width() {
		segment_maps = [];
		width = 0;
	}

	function update_maps_width() {
		const max = titles.length - 1;
		let index = 0;
		reset_maps_width();
		for (const title of titles) {
			const map = new Segment_Map(title, index, max, width, height);
			segment_maps.push(map);
			width += map.width;
			index += 1;
		}
	}

	function hit_closure(title: string, shift: boolean) {
		const index = titles.indexOf(title);
		const selected = !selected_indices.includes(index);
		if (selected) {
			selected_indices.push(index);
		}else {
			selected_indices = selected_indices.filter((i) => i != index);
		}
		selection_closure(selected_indices);
		return selected;
	}

</script>

<div class='segments'
	style='
		width: {width}px;
		position: absolute;
		left: {origin.x}px;
		top: {origin.y - 1}px;
		height: {height + 2}px;'>
	{#each segment_maps as segment_map}
		<Segment
			fill={fill}
			stroke={stroke}
			segment_map={segment_map}
			hit_closure={hit_closure}/>
	{/each}
</div>
