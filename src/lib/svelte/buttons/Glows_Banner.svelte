<script lang='ts'>
    import { w_show_info_ofType, w_background_color } from '../../ts/common/Stores';
	import { colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { k, Rect, Size, Point } from '../../ts/common/Global_Imports';
	import { s_details } from '../../ts/state/S_Details';
    import Separator from '../kit/Separator.svelte';
    import G_Titles from '../../ts/layout/G_Titles';
    import Glow_Button from './Glow_Button.svelte';
	export let handle_click: (title: string) => boolean;
    export let titles: string[];
    export let height: number;
    export let width: number;
    const g_titles = new G_Titles(titles, height, width, 0, 0, false, k.font_size.small);
    let banner_color = colors.bannerFor($w_background_color);
    let selected_title: string | null = null;

    // height	is of the banner
    // width	is overall width of the banner
    // titles	one for each buttons, separated by a vertical separator with wings
    //	handle	click separately for each title's button
    //  first	button is the widest, at the left

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);
    $: selected_title = $w_show_info_ofType;

    function intercept_click(title: string) {
        s_details.update_forInfoType(title);
        return handle_click(title); // this is the click handler for the banner
    }

</script>

<div
    style='
		display: flex;
		width: {width}px;
        position: absolute;
        flex-direction: row;
        align-items: stretch;'>
    <Separator
        origin={Point.zero}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
    {#each g_titles.titles as title, index}
        <Glow_Button
            title={title}
            height={height}
            handle_click={intercept_click}
            isSelected={title === selected_title}
            style={index === 0 ? 'left: 0;' : ''}
            width={g_titles.button_width_for(index)}
            position={index === 0 ? 'absolute' : 'relative'}/>
        {#if index > 0}
            <Separator
				length={height + 5}
				isHorizontal={false}
                thickness={k.thickness.separator.ultra_thin}
                corner_radius={k.radius.gull_wings.ultra_thin}
                origin={new Point(g_titles.button_left_for(index), 1)}/>
        {/if}
    {/each}
    <Separator
        origin={Point.y(height)}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
</div> 