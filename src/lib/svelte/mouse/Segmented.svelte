<script lang='ts'>
	import { k, u, Rect, Size, Point, Segment_Map } from '../../ts/common/Global_Imports';
	import Segment from './Segment.svelte';
	export let selection_closure = (titles) => {};
	export let selected: Array<string> = [];
	export let titles: Array<string> = [];
	export let height = k.row_height - 2;
	export let fill = k.color_background;
	export let stroke = k.color_default;
	export let origin = Point.zero;
	export let multiple = false;
	let segment_maps: Array<Segment_Map> = [];
	let width = 0;

	update_maps_andWidth();
	function isSelected(title: string) { return selected.includes(title); }

	function reset_maps_width() {
		segment_maps = [];
		width = 0;
	}

	function update_maps_andWidth() {
		const max = titles.length - 1;
		let index = 0;
		reset_maps_width();
		for (const title of titles) {
			const map = new Segment_Map(title, isSelected(title), index, max, width, height);
			segment_maps.push(map);
			width += map.width;
			index += 1;
		}
	}

	function hit_closure(title: string, shift: boolean) {
		if (!multiple) {
			selected = [title];
		} else if (isSelected(title)) {
			selected.push(title);
		} else {
			selected = selected.filter(t => t != title);
		}
		selection_closure(selected);
		update_maps_andWidth();
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
