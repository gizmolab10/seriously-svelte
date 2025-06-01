<script lang='ts'>
	import { colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { k, Rect, Size, Point } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import Separator from '../kit/Separator.svelte';
    import G_Titles from '../../ts/layout/G_Titles';
    import Glow_Button from './Glow_Button.svelte';
    export let titles: string[];
    export let height: number;
    export let width: number;
    const g_titles = new G_Titles(titles, height, width, 0, 0, false, k.font_size.small);
    let banner_color = colors.bannerFor($w_background_color);

    // height	is of the banner
    // width	is overall width of the banner
    // titles	one for each buttons, separated by a vertical separator with wings
    //	handle	click separately for each title's button
    //  first	button is the widest, at the left

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);

</script>

<div
    style='
		display: flex;
		width: {width}px;
        position: absolute;
        flex-direction: row;
        align-items: stretch;'>
    <Separator
        origin={Point.y(0)}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
    {#each g_titles.titles as title, index}
        <Glow_Button
            title={title}
            height={height}
            style={index === 0 ? 'left: 0;' : ''}
            width={g_titles.button_width_for(index)}
            position={index === 0 ? 'absolute' : 'relative'}/>
        {#if index > 0}
            <Separator
				length={height + 7}
				isHorizontal={false}
                corner_radius={k.radius.gull_wings.thin}
                thickness={k.thickness.separator.ultra_thin}
                origin={Point.x(g_titles.button_left_for(index))}/>
        {/if}
    {/each}
    <Separator
        origin={Point.y(height)}
        corner_radius={k.radius.gull_wings.thin}
        thickness={k.thickness.separator.ultra_thin}/>
</div> 