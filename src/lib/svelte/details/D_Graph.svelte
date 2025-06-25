<script lang='ts'>
	import { k, u, ux, Rect, Point, colors, layout, T_Layer, T_Kinship, T_Auto_Fit } from '../../ts/common/Global_Imports';
	import { w_depth_limit, w_background_color, w_auto_fit_graph } from '../../ts/common/Stores';
	import { w_show_details_ofType, w_show_countDots_ofType } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Color from '../kit/Color.svelte';
	import Portal from 'svelte-portal';
	import { onMount } from 'svelte';
	export let top = 0;
	const height_gap = -2;
	const separator_left = 35;
	const position = 'relative';
	const picker_offset = `-88px`;
	const font_size = k.font_size.smaller;
	const color_left = k.width_details / 2 - 13;
	const segmented_width = k.width_details - 6;
	const segmented_height = k.height.button + 11;
	const separator_font_size = k.font_size.smallest;
	const fit_titles = [T_Auto_Fit.manual, T_Auto_Fit.always];
	const separator_width = k.width_details - 5 - separator_left * 2;
	const titles = [T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]];
	const heights = [10, 8, k.height.button - 6, height_gap, segmented_height, height_gap, segmented_height, height_gap, 6];
	const tops = u.cumulativeSum(heights);
	let color = $w_background_color;
	let colorOrigin = Point.square(-3.5);
	let color_wrapper: HTMLDivElement | null = null;

	$: if (color_wrapper || $w_show_details_ofType) {
		u.onNextTick(() => updateColorOrigin());
	}

	function handle_colors(result: string) {
		$w_background_color = color = result;
	}

	function handle_auto_fit(types: string[]) {
		$w_auto_fit_graph = types.includes(T_Auto_Fit.always);
	}

	function handle_count_dots(types: string[]) {
		$w_show_countDots_ofType = types as Array<T_Kinship>;
	}
	
	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

	function updateColorOrigin() {
		if (color_wrapper) {
			const origin = Rect.createFromDOMRect(color_wrapper.getBoundingClientRect()).origin.multipliedBy(1 / layout.scale_factor);
			colorOrigin = origin.offsetByXY(-3, -4);
		}
	}

</script>

<div class='display'
	style='
		left:0px;
		color:black;
		width: 100%;
		top:{top}px;
		position:{position};
		padding-bottom:{tops[8]}px;
		font-size:{k.font_size.small}px;'>
	<Separator
		isHorizontal={true}
		has_gull_wings={false}
		length={separator_width}
		margin={k.details_margin}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		origin={new Point(separator_left, tops[0])}
		thickness={k.thickness.separator.ultra_thin}
		title={'visible levels'}/>
	{#if ux.inTreeMode}
		<Slider
			max={12}
			isLogarithmic={true}
			value={$w_depth_limit}
			height={k.height.button}
			width={k.width_details - 26}
			thumb_color={colors.separator}
			origin={new Point(10, tops[1])}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.small}
			handle_value_change={handle_depth_limit}/>
	{:else}
		<div style='
			height:22px;
			display:flex;
			font-size:12px;
			position:relative;
			align-items:center;
			top:{tops[1] - 2}px;
			justify-content:center;'>
			radial graph only shows one level
		</div>
	{/if}
	<Separator
		isHorizontal={true}
		position={position}
		title='adjust to fit'
		has_gull_wings={false}
		length={separator_width}
		margin={k.details_margin}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		origin={new Point(separator_left, tops[2])}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		name='fit'
		allow_none={true}
		titles={fit_titles}
		allow_multiple={false}
		width={segmented_width}
		height={k.height.button}
		origin={new Point(0, tops[3])}
		handle_selection={handle_auto_fit}
		selected={[$w_auto_fit_graph ? T_Auto_Fit.always : T_Auto_Fit.manual]}/>
	<Separator
		isHorizontal={true}
		position={position}
		has_gull_wings={false}
		length={separator_width}
		margin={k.details_margin}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		origin={new Point(separator_left, tops[4])}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		name='counts'
		titles={titles}
		allow_none={true}
		allow_multiple={true}
		width={segmented_width}
		height={k.height.button}
		origin={new Point(0, tops[5])}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}/>
	<Separator
		position={position}
		isHorizontal={true}
		has_gull_wings={true}
		title='background color'
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[6])}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<div 
		class= 'background-color'
		bind:this={color_wrapper}
		style='
			width: 16px;
			height: 16px;
			top: {tops[7]}px;
			left: {color_left}px;
			position: {position};
			border: 1px solid black;
			border-radius: 50%;
			z-index: {T_Layer.detailsPlus_3};
			background-color: {$w_background_color}'>
		<Portal>
			<Color
				color={color}
				origin={colorOrigin}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
		</Portal>
	</div>
</div>
