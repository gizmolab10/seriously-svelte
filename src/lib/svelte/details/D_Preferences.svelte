<script lang='ts'>
	import { k, u, ux, Rect, Point, colors, layout, T_Layer, T_Kinship, T_Auto_Adjust, T_Graph } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType, w_show_tree_ofType, w_show_countDots_ofType } from '../../ts/common/Stores';
	import { w_depth_limit, w_background_color, w_auto_adjust_graph } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Portal from '../draw/Portal.svelte';
	import Color from '../mouse/Color.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const back_up = -5;
	const separator_left = 35;
	const position = 'relative';
	const picker_offset = `-88px`;
	const width = k.width.details;
	const color_left = width / 2 - 13;
	const segmented_width = width - 6;
	const segmented_height = k.height.button;
	const separator_height = segmented_height + 9;
	const separator_width = width - 5 - separator_left * 2;
	const fourth_height = (ux.inTreeMode ? segmented_height : -4) - 8;
	let color = $w_background_color;
	let color_origin = Point.square(-3.5);
	let color_wrapper: HTMLDivElement | null = null;

	const heights = [
		11,
		back_up,			// 1 child/related
		separator_height,
		back_up - 4,		// 3. tree levels
		fourth_height,
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

	function update_color_origin() {
		if (color_wrapper) {
			const origin = Rect.createFromDOMRect(color_wrapper.getBoundingClientRect()).origin.multipliedBy(1 / layout.scale_factor);
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
		padding-bottom:{tops[10]}px;
		font-size:{k.font_size.info}px;'>
	{#if ux.inTreeMode}
		<Separator
			length={width}
			isHorizontal={true}
			position={position}
			has_gull_wings={true}
			origin={Point.y(tops[0])}
			margin={k.details_margin}
			title='tree relationships'
			title_left={k.separator_title_left}
			thickness={k.thickness.separator.details}/>
		{#key $w_show_tree_ofType}
			{#key $w_show_tree_ofType}
				<Segmented
					width={180}
					name='tree-types'
					allow_multiple={true}
					height={segmented_height}
					selected={$w_show_tree_ofType}
					origin={new Point(18, tops[1])}
					titles={[T_Kinship.child, T_Kinship.related]}
					handle_selection={(titles) => layout.handle_mode_selection('tree', titles)}/>
			{/key}
		{/key}
		<Separator
			length={width}
			title='tree levels'
			isHorizontal={true}
			position={position}
			has_gull_wings={true}
			origin={Point.y(tops[2])}
			title_left={k.separator_title_left}
			thickness={k.thickness.separator.details}/>
		<Slider
			max={12}
			width={width - 26}
			isLogarithmic={true}
			value={$w_depth_limit}
			height={segmented_height}
			thumb_color={colors.separator}
			origin={new Point(10, tops[3])}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.banners}
			handle_value_change={handle_depth_limit}/>
	{/if}
	<Separator
		length={width}
		isHorizontal={true}
		position={position}
		has_gull_wings={true}
		title='force graph to:'
		margin={k.details_margin}
		origin={Point.y(tops[4])}
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}/>
	<Segmented
		allow_none={true}
		name='auto-adjust'
		allow_multiple={false}
		width={segmented_width}
		height={segmented_height}
		origin={Point.y(tops[5])}
		selected={[$w_auto_adjust_graph]}
		handle_selection={handle_auto_adjust}
		titles={[T_Auto_Adjust.selection, T_Auto_Adjust.fit]}/>
	<Separator
		length={width}
		isHorizontal={true}
		position={position}
		has_gull_wings={true}
		margin={k.details_margin}
		origin={Point.y(tops[6])}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}/>
	<Segmented
		name='counts'
		allow_none={true}
		allow_multiple={true}
		width={segmented_width}
		height={segmented_height}
		origin={Point.y(tops[7])}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}
		titles={[T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]]}/>
	<Separator
		length={width}
		position={position}
		isHorizontal={true}
		has_gull_wings={true}
		has_thin_divider={true}
		title='background color'
		margin={k.details_margin}
		origin={Point.y(tops[8])}
		title_left={k.separator_title_left}
		thickness={k.thickness.separator.details}/>
	<div 
		class= 'background-color-dot'
		bind:this={color_wrapper}
		style='
			width: 17px;
			height: 17px;
			top: {tops[9]}px;
			border-radius: 50%;
			left: {color_left}px;
			position: {position};
			border: 1px solid black;
			z-index: {T_Layer.detailsPlus_3};
			background-color: {$w_background_color}'>
		<Portal className='preferences-color-portal' id='preferences'>
			<Color
				color={color}
				origin={color_origin}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
		</Portal>
	</div>
</div>
