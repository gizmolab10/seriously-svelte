<script lang='ts'>
	import { k, s, u, x, show, Rect, Point, colors, layout, controls } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Kinship, T_Auto_Adjust, T_Cluster_Pager } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Portal from '../draw/Portal.svelte';
	import Color from '../mouse/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const back_up = -5;
	const separator_left = 35;
	const position = 'relative';
	const width = k.width.details;
	const picker_offset = `-189px`;
	const color_left = width / 2 - 13;
	const segmented_width = width - 6;
	const { w_scale_factor } = layout;
	const { w_separator_color } = colors;
	const segmented_height = k.height.button;
	const separator_height = segmented_height + 9;
	const { w_t_cluster_pager, w_auto_adjust_graph } = s;
	const separator_width = width - 5 - separator_left * 2;
	const { w_show_details_ofType, w_show_countDots_ofType } = show;
	let color_wrapper: HTMLDivElement | null = null;
	let color_origin = Point.square(-3.5);
	let color = $w_separator_color;

	const heights = [
		10,
		back_up,			// 5. show tiny dots for
		separator_height,
		back_up,			// 7. force graph
		separator_height,
		back_up,			// 9. background color
		5];

	const tops = u.cumulativeSum(heights);

	$: if (color_wrapper || $w_show_details_ofType) {
		u.onNextTick(() => update_color_origin());
	}

	function handle_colors(color: string) {
		const lume = colors.luminance_ofColor(color);
		if (lume > 0.95) {
			color = 'lightgray';
		} else {
			color = color;
		}
		$w_separator_color = color;
	}

	function handle_auto_adjust(types: Array<T_Auto_Adjust | null>) {
		$w_auto_adjust_graph = types.length > 0 ? types[0] : null;
	}

	function handle_pager_type(types: Array<T_Cluster_Pager | null>) {
		$w_t_cluster_pager = types.length > 0 ? types[0] : T_Cluster_Pager.sliders;
	}

	function handle_count_dots(types: string[]) {
		$w_show_countDots_ofType = types as Array<T_Kinship>;
	}

	function update_color_origin() {
		if (color_wrapper) {
			const origin = Rect.createFromDOMRect(color_wrapper.getBoundingClientRect()).origin.multipliedEquallyBy(1 / $w_scale_factor);
			color_origin = origin.offsetByXY(-3, -4);
		}
	}

</script>

<div class='preferences-details'
	style='
		left:0px;
		color:black;
		width: 100%;
		top:{top}px;
		position:{position};
		padding-bottom:{tops[6]}px;
		font-size:{k.font_size.info}px;'>
	<Separator name='tiny-dots'
		length={width}
		isHorizontal={true}
		position={position}
		has_gull_wings={true}
		margin={k.details_margin}
		origin={Point.y(tops[0])}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}/>
	<Segmented name='counts'
		left={106}
		allow_none={true}
		allow_multiple={true}
		width={segmented_width}
		height={segmented_height}
		origin={Point.y(tops[1])}
		handle_selection={handle_count_dots}
		selected={$w_show_countDots_ofType}
		titles={[T_Kinship[T_Kinship.children], T_Kinship[T_Kinship.parents], T_Kinship[T_Kinship.related]]}/>
	<Separator name='first-preference'
		length={width}
		isHorizontal={true}
		position={position}
		has_gull_wings={true}
		margin={k.details_margin}
		origin={Point.y(tops[2])}
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}
		title={controls.inTreeMode ? 'force graph to:' : 'paging style:'}/>
	{#if controls.inTreeMode}
		<Segmented name='auto-adjust'
			left={106}
			allow_none={true}
			allow_multiple={false}
			width={segmented_width}
			height={segmented_height}
			origin={Point.y(tops[3])}
			selected={[$w_auto_adjust_graph]}
			handle_selection={handle_auto_adjust}
			titles={[T_Auto_Adjust.selection, T_Auto_Adjust.fit]}/>
	{:else}
		<Segmented name='paging-style'
			left={106}
			allow_none={false}
			allow_multiple={false}
			width={segmented_width}
			height={segmented_height}
			origin={Point.y(tops[3])}
			selected={[$w_t_cluster_pager]}
			handle_selection={handle_pager_type}
			titles={[T_Cluster_Pager.sliders, T_Cluster_Pager.steppers]}/>
	{/if}
	<Separator name='background-color'
		length={width}
		position={position}
		isHorizontal={true}
		title='accent color'
		has_gull_wings={true}
		has_thin_divider={true}
		margin={k.details_margin}
		origin={Point.y(tops[4])}
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}/>
	<div class= 'background-color-dot'
		bind:this={color_wrapper}
		style='
			width: 17px;
			height: 17px;
			top: {tops[5]}px;
			border-radius: 50%;
			left: {color_left}px;
			position: {position};
			border: 1px solid black;
			z-index: {T_Layer.detailsPlus_3};
			background-color: {$w_separator_color}'>
		<Portal className='preferences-color-portal' id='preferences'>
			<Color
				color={color}
				origin={color_origin}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
		</Portal>
	</div>
</div>
