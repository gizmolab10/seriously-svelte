<script lang='ts'>
	import { k, Point, T_Counts } from '../../ts/common/Global_Imports';
	import { s_t_counts } from '../../ts/state/S_Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	export let top = 0;
	const font_ratio = 0.8;
	const info_width = k.width_details - 30;
	const separator_font_size = `${k.tiny_font_size}px`;
	const titles = [T_Counts[T_Counts.children], T_Counts[T_Counts.parents], T_Counts[T_Counts.related]];
	let rebuilds = 0;
	
	function selection_closure(t_counts: Array<string>) {
		$s_t_counts = t_counts as Array<T_Counts>;
		rebuilds += 1;
	}

	</script>

{#key rebuilds}
	<div class='display'
		style='
			left:10px;
			color:black;
			top:{top + 3}px;
			position:absolute;
			font-size:{font_ratio}em;
			width:{k.width_details}px;'>
			<Separator title_font_size={separator_font_size} top=2 left=5 title='show tiny dots for' width={info_width}/>
		<Segmented
			titles={titles}
			allow_multiple={true}
			name='counts-selector'
			selected={$s_t_counts}
			origin={new Point(4, 9)}
			height={k.row_height * font_ratio}
			selection_closure={selection_closure}/>
	</div>
{/key}