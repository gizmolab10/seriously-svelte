<script lang='ts'>
	import { k, u, ux, Rect, Size, Point, Segment_Map } from '../../ts/common/Global_Imports';
	import Segment from './Segment.svelte';
	export let selection_closure = (titles) => {};
	export let selected: Array<string> = [];
	export let titles: Array<string> = [];
	export let height = k.row_height - 2;
	export let fill = k.color_background;
	export let stroke = k.color_default;
	export let origin = Point.zero;
	export let multiple = false;
    export let name = k.empty;
	let segment_maps: Array<Segment_Map> = [];
	let width = height / 2;

	update_maps_andWidth();
	function isSelected(title: string) { return selected.includes(title); }

	function reset_maps_andWidth() {
		width = height / 2;
		segment_maps = [];
	}

	function update_maps_andWidth() {
		const max = titles.length - 1;
		let left = height / 2;
		let index = 0;
		reset_maps_andWidth();
		for (const title of titles) {
			const map = Segment_Map.grab_segment_map(name, title, isSelected(title), index, max, left, height);
			segment_maps.push(map);
			left += map.width;
			index += 1;
		}
		width = left;
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

<div class={name + '-segments'}
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
