<script lang='ts'>
	import { k, Rect, Size, Point, colors } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	import Glow_Button from '../buttons/Glow_Button.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import G_Repeater from '../../ts/layout/G_Repeater';
	import Separator from '../mouse/Separator.svelte';
	export let toggle_hidden: (title: string) => void;
	export let font_size = k.font_size.details;
    export let isSelected: boolean = false;
	export let titles: string[];
	export let height: number;
	export let width: number;
	const main_title = titles[0];
	const g_repeater = new G_Repeater(titles, height, width, 0, 0, 7, 0, false, font_size, true);
	let banner_color = colors.ofBannerFor($w_background_color);

	//////////////////////////////////////////////////////////////////////////////////
	//																				//
	//	titles:	one for each buttons, separated by a vertical separator with wings	//
	//																				//
	//	g_repeater computes layout													//
	//	handle click separately for each title's button								//
	//  first button is the widest, at the left										//
	//																				//
	//////////////////////////////////////////////////////////////////////////////////

	$: {
		const _ = $w_background_color;
		banner_color = colors.ofBannerFor($w_background_color);
	}

	function intercept_click(title: string) {
		if (title === main_title) {
			toggle_hidden(title);
		} else {
			s_details.update_forBanner(main_title, title);		// main title is the banner title
		}
	}

</script>

<div
	style='
		display: flex;
		width: {width}px;
		position: relative;
		flex-direction: row;
		align-items: stretch;'>
	<Separator
		origin={Point.zero}
		isHorizontal={true}
		has_thin_divider={true}
		corner_radius={k.radius.gull_wings.thin}
		thickness={k.thickness.separator.banners}/>
	{#each g_repeater.titles as title, index}
		<Glow_Button
			title={title}
			height={height}
			owner={main_title}
			font_size={font_size}
			isSelected={isSelected}
			handle_click={intercept_click}
			detect_autorepeat={title != main_title}
			width={g_repeater.button_width_for(index)}/>
		{#if index > 0}
			<Separator
				length={height + 6}
				isHorizontal={false}
				has_thin_divider={true}
				thickness={k.thickness.separator.banners}
				corner_radius={k.radius.gull_wings.ultra_thin}
				origin={new Point(g_repeater.button_left_for(index), 1)}/>
		{/if}
	{/each}
	<Separator
		isHorizontal={true}
		origin={Point.y(height)}
		corner_radius={k.radius.gull_wings.thin}
		thickness={k.thickness.separator.banners}/>
</div> 