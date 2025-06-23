<script lang='ts'>
	import { k, Rect, Size, Point, colors } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	import Glow_Button from '../buttons/Glow_Button.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import G_Repeater from '../../ts/layout/G_Repeater';
	import Separator from '../kit/Separator.svelte';
	export let toggle_hidden: (title: string) => void;
	export let font_size = s_details.font_size;
	export let titles: string[];
	export let height: number;
	export let width: number;
	const g_repeater = new G_Repeater(titles, height, width, 0, 0, 7, 0, false, font_size);
	let banner_color = colors.ofBannerFor($w_background_color);
	let selected_title: string | null = null;

	//////////////////////////////////////////////////////////////////////////////////
	//																				//
	//	titles:	one for each buttons, separated by a vertical separator with wings	//
	//																				//
	//	g_repeater computes layout													//
	//	handle click separately for each title's button								//
	//  first button is the widest, at the left										//
	//																				//
	//////////////////////////////////////////////////////////////////////////////////

	$: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);

	function intercept_click(title: string) {
		if (title === titles[0]) {
			toggle_hidden(title);
		} else {
			s_details.update_forBanner(titles[0], title);
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
		thickness={k.thickness.separator.ultra_thin}/>
	{#each g_repeater.titles as title, index}
		<Glow_Button
			title={title}
			height={height}
			font_size={font_size}
			handle_click={intercept_click}
			isSelected={title === selected_title}
			width={g_repeater.button_width_for(index)}/>
		{#if index > 0}
			<Separator
				length={height + 6}
				isHorizontal={false}
				thickness={k.thickness.separator.ultra_thin}
				corner_radius={k.radius.gull_wings.ultra_thin}
				origin={new Point(g_repeater.button_left_for(index), 1)}/>
		{/if}
	{/each}
	<Separator
		isHorizontal={true}
		origin={Point.y(height)}
		corner_radius={k.radius.gull_wings.thin}
		thickness={k.thickness.separator.ultra_thin}/>
</div> 