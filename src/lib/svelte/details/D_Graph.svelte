<script lang='ts'>
	import { k, u, ux, Rect, Point, colors, layout, T_Layer, T_Kinship, T_Auto_Adjust, T_Graph } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType, w_show_tree_ofType, w_show_countDots_ofType } from '../../ts/common/Stores';
	import { w_depth_limit, w_background_color, w_auto_adjust_graph } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Color from '../kit/Color.svelte';
	import Portal from 'svelte-portal';
	import { onMount } from 'svelte';
	export let top = 0;
	const separator_gap = -5;
	const separator_left = 35;
	const position = 'relative';
	const picker_offset = `-88px`;
	const font_size = k.font_size.smaller;
	const color_left = k.width_details / 2 - 13;
	const segmented_width = k.width_details - 6;
	const segmented_height = k.height.button + 8;
	const separator_width = k.width_details - 5 - separator_left * 2;
	const fourth_height = ux.inRadialMode ? -13 : k.height.button - 9;
	let color = $w_background_color;
	let colorOrigin = Point.square(-3.5);
	let color_wrapper: HTMLDivElement | null = null;

	$: if (color_wrapper || $w_show_details_ofType) {
		u.onNextTick(() => updateColorOrigin());
	}

	function handle_colors(result: string) {
		$w_background_color = color = result;
	}

	function handle_auto_adjust(types: Array<T_Auto_Adjust | null>) {
		$w_auto_adjust_graph = types.length > 0 ? types[0] : null;
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

	const heights = [
		8,
		separator_gap,
		k.height.button + 9,
		-8,
		fourth_height,
		separator_gap,
		segmented_height,
		separator_gap,
		segmented_height,
		separator_gap,
		4];

	const tops = u.cumulativeSum(heights);

</script>

<div class='display'
	style='
		left:0px;
		color:black;
		width: 100%;
		top:{top}px;
		position:{position};
		padding-bottom:{tops[10]}px;
		font-size:{k.font_size.small}px;'>
	{#if ux.inTreeMode}
		<Separator
			isHorizontal={true}
			position={position}
			has_gull_wings={false}
			length={separator_width}
			margin={k.details_margin}
			title='tree relationships'
			title_left={k.separator_title_left}
			origin={new Point(separator_left, tops[0])}
			thickness={k.thickness.separator.ultra_thin}/>
		{#key $w_show_tree_ofType}
			{#key $w_show_tree_ofType}
				<Segmented
					width={180}
					name='tree-types'
					allow_multiple={true}
					selected={$w_show_tree_ofType}
					origin={new Point(18, tops[1])}
					titles={[T_Kinship.child, T_Kinship.related]}
					handle_selection={(titles) => layout.handle_mode_selection('tree', titles)}/>
			{/key}
		{/key}
		<Separator
			title='tree levels'
			isHorizontal={true}
			position={position}
			has_gull_wings={false}
			length={separator_width}
			title_left={k.separator_title_left}
			origin={new Point(separator_left, tops[2])}
			thickness={k.thickness.separator.ultra_thin}/>
		<Slider
			max={12}
			isLogarithmic={true}
			value={$w_depth_limit}
			height={k.height.button}
			width={k.width_details - 26}
			thumb_color={colors.separator}
			origin={new Point(10, tops[3])}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.smaller}
			handle_value_change={handle_depth_limit}/>
	{/if}
	<Separator
		isHorizontal={true}
		position={position}
		has_gull_wings={false}
		title='force graph to:'
		length={separator_width}
		margin={k.details_margin}
		title_left={k.separator_title_left}
		origin={new Point(separator_left, tops[4])}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		allow_none={true}
		name='auto-adjust'
		allow_multiple={false}
		width={segmented_width}
		height={k.height.button}
		origin={Point.y(tops[5])}
		selected={[$w_auto_adjust_graph]}
		handle_selection={handle_auto_adjust}
		titles={[T_Auto_Adjust.selection, T_Auto_Adjust.fit]}/>
	<Separator
		isHorizontal={true}
		position={position}
		has_gull_wings={false}
		length={separator_width}
		margin={k.details_margin}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		origin={new Point(separator_left, tops[6])}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		name='counts'
		allow_none={true}
		allow_multiple={true}
		width={segmented_width}
		height={k.height.button}
		origin={Point.y(tops[7])}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}
		titles={[T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]]}/>
	<Separator
		position={position}
		isHorizontal={true}
		has_gull_wings={true}
		has_thin_divider={true}
		title='background color'
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[8])}
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.ultra_thin}/>
	<div 
		class= 'background-color'
		bind:this={color_wrapper}
		style='
			width: 16px;
			height: 16px;
			top: {tops[9]}px;
			border-radius: 50%;
			left: {color_left}px;
			position: {position};
			border: 1px solid black;
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
